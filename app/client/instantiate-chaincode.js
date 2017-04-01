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
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('instantiate-chaincode');
var ORGS = util.ORGS;

var tx_id = null;
var nonce = null;
var the_user = null;
var targets = [];
var eventhubs = [];
var allEventhubs = [];

//Invoke transactions just use org1's identity to
//submit the request. intentionally we are using a different org
//than the one that submitted the "move" transaction, although either org
//should work properly
var defaultOrg = 'org1';


module.exports.instantiateChaincode = instantiateChaincode;
function instantiateChaincode(org) {
	logger.info('\n\n***** Hyperledger fabric client: instantiate chaincode *****');

	// client and chain should be claimed here
	var client = new hfc();
	var chain = null;

	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = defaultOrg;
	var options = { 
			path: util.storePathForOrg(util.getOrgNameByOrg(ORGS, org)) 
		};
	
	return hfc.newDefaultKeyValueStore(options)
	.then((keyValueStore) => {
		client.setStateStore(keyValueStore);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		// Currently fine without eventbus
		chain = setup.setupChainWithAllPeers(client, ORGS);
		return admin;

	}).then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		return sendInstantiateProposal(chain, admin, util.getMspid(ORGS, org));

	}).then((results) => {
		if (util.checkProposalResponses(results, 'Instantiate transaction', logger)) {
			var proposalResponses = results[0];
			var proposal = results[1];
			var header   = results[2];
			logger.debug('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', 
					proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);
			commitInstantiate(chain, proposalResponses, proposal, header);
		} else {
			util.throwError(logger, null, 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	}, (err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to send instantiate proposal due to error: ');

	}).then((response) => {
		return finishCommit(response, logger);
	}, (err) => {
		logger.error('Failed to send instantiate due to error: ' + err.stack ? err.stack : err);
		return 'FAILED';
	});
};


function commitInstantiate(chain, proposalResponses, proposal, header) {
	var request = {
			proposalResponses: proposalResponses,
			proposal: proposal,
			header: header
		};
	logger.debug('Commit request is %s ', JSON.stringify(request));

	// set the transaction listener and set a timeout of 30sec
	// if the transaction did not get committed within the timeout period,
	// fail the test
	var deployId = tx_id.toString();
	
	var eventPromises = [];
	eventhubs.forEach((eh) => {
		addTxPromise(eventPromises, eh, deployId);
	});	

	/*
	var eventPromises = [];
	eventhubs.forEach((eh) => {
		let txPromise = new Promise((resolve, reject) => {
		let handle = setTimeout(reject, 30000);

		eh.registerTxEvent(deployId.toString(), (tx, code) => {
			logger.info('The chaincode instantiate transaction has been committed on peer '+ eh.ep.addr);
			clearTimeout(handle);
			eh.unregisterTxEvent(deployId);

			if (code !== 'VALID') {
				logger.error('The chaincode instantiate transaction was invalid, code = ' + code);
				reject();
			} else {
				logger.info('The chaincode instantiate transaction was valid.');
				resolve();
			}
		});
		});

		eventPromises.push(txPromise);
	});
	*/
	
	var sendPromise = chain.sendTransaction(request);
	return Promise.all([sendPromise].concat(eventPromises))
	.then((results) => {
		logger.info('Instantiate transaction event promise all complete.');
		return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call

	}).catch((err) => {
		util.throwError(logger, err, 'Failed to send instantiate transaction and get notifications within the timeout period.');
	});	
}


function addTxPromise(eventPromises, eh, deployId) {
	let txPromise = new Promise((resolve, reject) => {
		// set expireTime as 30s
		registerTxEvent(eh, resolve, reject, 30000, deployId);
	});
	eventPromises.push(txPromise);
}


function finishCommit(response, logger) {
	if (response.status === 'SUCCESS') {
		logger.info('Successfully sent transaction to the orderer.');
	} else {
		util.throwError(logger, response.status, 'Failed to order the transaction. Error code: ');
	}
}


function registerTxEvent(eh, resolve, reject, expireTime, deployId) {
	let handle = setTimeout(reject, expireTime);

	logger.debug('registerTxEvent with deployId %s ', deployId);

	eh.registerTxEvent(deployId, (tx, code) => {
		txEventListener(eh, resolve, reject, handle, deployId);
	});
}


function sendInstantiateProposal(chain, admin, mspid) {

	the_user = admin;
	the_user.mspImpl._id = mspid;

	nonce = ClientUtils.getNonce()
	tx_id = chain.buildTransactionID(nonce, the_user);

	// send proposal to endorser
	// for supplychain
	var request = {
			chaincodePath: util.chaincodePath,
			chaincodeId: util.chaincodeId,
			chaincodeVersion: util.chaincodeVersion,
			fcn: 'init',
			args: ["Sku", "Sku654321", "TraceInfo", "this is genesis block"],
			chainId: util.channel,
			txId: tx_id,
			nonce: nonce
		};

	logger.debug('Sending instantiate transaction proposal "%s"', JSON.stringify(request));

	return chain.sendInstantiateProposal(request);
}


function txEventListener(eh, resolve, reject, handle, deployId) {
	logger.debug('get callback of deployId %s ', deployId);

	clearTimeout(handle);

	//TODO：目前这里会导致程序异常退出
	eh.unregisterTxEvent(deployId);

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