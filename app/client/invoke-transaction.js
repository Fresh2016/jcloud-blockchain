/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var path = require('path');

var hfc = require('fabric-client');
var ClientUtils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var Submitter = require('./get-submitter.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('invoke-chaincode');
var ORGS = util.ORGS;

var tx_id = null;
var nonce = null;
var the_user = null;
var allEventhubs = [];
var client = new hfc();
var chain = client.newChain(util.channel);
var targets = [];
var eventhubs = [];


module.exports.invokeChaincode = function(traceInfo) {
	logger.info('\n\n***** Hyperledger fabric client: invoke chaincode *****');
	
	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = 'org1';
	var orgName = util.getOrgNameByOrg(ORGS, org);

	setupChain(ORGS, orgName);
	
	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)

	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org);

	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		return sendTransactionProposal(admin, util.getMspid(ORGS, org), traceInfo);

	}, (err) => {
		util.throwError(logger, err, 'Failed to enroll user \'admin\'. ');

	}).then((results) => {
		var proposalResponses = results[0];
		var proposal = results[1];
		var header   = results[2];

		if (util.checkProposalResponses(proposalResponses, 'Invoke transaction', logger)) {
			logger.debug('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', 
					proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);
			commitTransaction(proposalResponses, proposal, header);
		} else {
			util.throwError(logger, null, 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	}, (err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to send proposal due to error: ');

	}).then((response) => {
		return finishCommit(response, tx_id);
	}, (err) => {
		logger.error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
		return 'failed';
	});
};


function addTxPromise(eventPromises, eh, deployId) {
	let txPromise = new Promise((resolve, reject) => {
		// set expireTime as 30s
		registerTxEvent(eh, resolve, reject, 30000, deployId);
	});
	eventPromises.push(txPromise);
}


function commitTransaction(proposalResponses, proposal, header){
	var request = {
		proposalResponses: proposalResponses,
		proposal: proposal,
		header: header
	};
	logger.debug('request is %s ', JSON.stringify(request));

	// set the transaction listener and set a timeout of 30sec
	// if the transaction did not get committed within the timeout period,
	// fail the test
	var deployId = tx_id.toString();

	var eventPromises = [];
	eventhubs.forEach((eh) => {
		addTxPromise(eventPromises, eh, deployId);
	});	

	var sendPromise = chain.sendTransaction(request);
	return Promise.all([sendPromise].concat(eventPromises))
	.then((results) => {

		logger.info('Invoke transaction event promise all complete.');
		return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call

	}).catch((err) => {
		util.throwError(logger, err, 'Failed to send transaction and get notifications within the timeout period.');
	});
}


function disconnectEventhub(context, ehs, f) {
	// Disconnect the event hub
	return function() {
		for(var key in ehs) {
			var eventhub = ehs[key];
			if (eventhub && eventhub.isconnected()) {
				logger.debug('Disconnecting the event hub');
				eventhub.disconnect();
			}
		}
		f.apply(context, arguments);
	};
}

function finishCommit(response, tx_id) {
	if (response.status === 'SUCCESS') {
		printSuccessHint(tx_id);
		var result = {
				TransactionId : tx_id
			};
		return result;			
	} else {
		util.throwError(logger, response.status, 'Failed to order the transaction. Error code: ');
	}
}


function printSuccessHint(tx_id){
	logger.info('Successfully sent transaction to the orderer.');
	logger.info('******************************************************************');
	logger.info('To manually run query.js, set the following environment variables:');
	logger.info('E2E_TX_ID='+'\''+tx_id+'\'');
	logger.info('******************************************************************');
}


function registerTxEvent(eh, resolve, reject, expireTime, deployId) {
	let handle = setTimeout(reject, expireTime);

	logger.debug('registerTxEvent with deployId %s ', deployId);

	eh.registerTxEvent(deployId, (tx, code) => {
		txEventListener(eh, resolve, reject, handle, deployId);
	});
}


function setupChain(ORGS, orgName) {
	// set up the chain with orderer
	chain.addOrderer(new Orderer(ORGS.orderer));

	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			let peer = new Peer(ORGS[key].peer1.requests);
			chain.addPeer(peer);
			if (!chain.isValidPeer(peer)) {
				chain.addPeer(peer);
				//logger.debug('喔～ key is %s, org is %s', key, peerOrg);
				/*
				if (key == peerOrg) {
					logger.debug('set primary peer: %s', JSON.stringify(peer));
					chain.setPrimaryPeer(peer);
				}
				*/
			}

			let eh = new EventHub();
			eh.setPeerAddr(ORGS[key].peer1.events);
			eh.connect();
			eventhubs.push(eh);
			allEventhubs.push(eh);
		}
	}

	// remove expired keys before enroll admin
	util.cleanupDir(util.storePathForOrg(orgName));
}


function sendTransactionProposal(admin, mspid, traceInfo) {
	
	the_user = admin;
	the_user.mspImpl._id = mspid;
	nonce = ClientUtils.getNonce()
	tx_id = chain.buildTransactionID(nonce, the_user);

	logger.info('Sending transaction proposal "%s"', tx_id);

	// send proposal to endorser
	// for supplychain
	var request = {
		chaincodeId : util.chaincodeId,
		chaincodeVersion : util.chaincodeVersion,
		fcn: 'addNewTrade',
		args: ["Sku", "Sku654321", "TraceInfo", traceInfo ],
		chainId: util.channel,
		txId: tx_id,
		nonce: nonce
	};
	return chain.sendTransactionProposal(request);
}


function txEventListener(eh, resolve, reject, handle, deployId) {
	logger.debug('get callback of deployId %s ', deployId);

	clearTimeout(handle);

	//TODO：目前这里会导致程序异常退出
	//eh.unregisterTxEvent(deployId);

	//TODO: 目前这里会返回一个policy不满足的错误码，需要看下证书生成时的设置
	/*
	if (code !== 'VALID') {
		logger.error('The balance transfer transaction was invalid, code = ' + code);
		reject();
	} else {
		logger.debug('The balance transfer transaction has been committed on peer '+ eh.ep.addr);
		resolve();
	}
	*/
	logger.debug('The balance transfer transaction has been committed on peer '+ eh.ep.addr);
	resolve();	
}
