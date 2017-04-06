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
var Submitter = require('./get-submitter.js');
var exe = require('./execute-recursively.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('invoke-chaincode');
var ORGS = util.ORGS;

var targets = [];

//Invoke transactions just use org1's identity to
//submit the request. intentionally we are using a different org
//than the one that submitted the "move" transaction, although either org
//should work properly
var defaultOrg = 'org1';
// Used by transaction event listener
var defaultExpireTime = 30000;

module.exports.instantiateChaincode = instantiateChaincode;
module.exports.invokeChaincode = invokeChaincode;


function addTxPromise(eventPromises, eh, deployId) {
	let txPromise = new Promise((resolve, reject) => {
		// set expireTime as 30s
		registerTxEvent(eh, resolve, reject, defaultExpireTime, deployId);
	});
	eventPromises.push(txPromise);
}


function commitTransaction(chain, proposalResponses, proposal, header, eventhubs, tx_id) {
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

	var sendPromise = chain.sendTransaction(request);
	return Promise.all([sendPromise].concat(eventPromises))
	.then((results) => {
		return processCommitResponse(results, tx_id);
	}).catch((err) => {
		util.throwError(logger, err, 'Failed to commit and get notifications within the timeout period.');
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

function finishCommit(response, logger, tx_id) {
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


function instantiateChaincode() {
	logger.info('\n\n***** Hyperledger fabric client: instantiate chaincode *****');
	
	var orgs = util.getOrgs(ORGS);
	logger.info('There are %s organizations: %s. Going to instantiate chaincode one by one.', orgs.length, orgs);

	return exe.executeTheNext(orgs, instantiateChaincodeByOrg, 'Instantiate Chaincode')
	.catch((err) => {
		logger.error('Failed to instantiate chaincode with error: ' + err.stack ? err.stack : err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


function generateInvokeRequest(fcn, nonce, tx_id, traceInfo) {
	var request = {
			chainId: util.channel,
			chaincodeId: util.chaincodeId,
			chaincodeVersion: util.chaincodeVersion,
			fcn: fcn,
			args: ["Sku", "Sku654321", "TraceInfo", traceInfo],
			txId: tx_id,
			nonce: nonce
		};
	
	if ('init' == fcn) {
		request.chaincodePath = util.chaincodePath;
	}
	
	return request;
}


function instantiateChaincodeByOrg(org) {
	// Client and chain should be claimed here
	var client = new hfc();
	// TODO: add event to instantiate
	var eventhubs = [];
	var chain = setup.setupChainByOrg(client, ORGS, org);
	var tx_id = { value : null };

	var options = { 
			path: util.storePathForOrg(util.getOrgNameByOrg(ORGS, org)) 
		};

	return hfc.newDefaultKeyValueStore(options)
	.then((keyValueStore) => {
		client.setStateStore(keyValueStore);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		return sendInstantiateProposal(chain, admin, util.getMspid(ORGS, org), tx_id);

	}).then((results) => {
		if (util.checkProposalResponses(results, 'Instantiate transaction', logger)) {
			var proposalResponses = results[0];
			var proposal = results[1];
			var header   = results[2];
			logger.debug('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', 
					proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);

			return commitTransaction(chain, proposalResponses, proposal, header, eventhubs, tx_id.value);
		} else {
			util.throwError(logger, null, 'Bad proposal responses. ');
		}
	}).catch((err) => {
		logger.error('Failed to instantiate chaincode with error: ' + err.stack ? err.stack : err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


function invokeChaincode(traceInfo) {
	logger.info('\n\n***** Hyperledger fabric client: invoke chaincode *****');

	// client and chain should be claimed here
	var client = new hfc();
	var chain = null;

	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = defaultOrg;
	var tx_id = { value : null };
	var eventhubs = [];
	
	return setup.getAlivePeer(ORGS, org)
	.then((peerInfo) => {
		logger.debug('Successfully get alive peer %s', JSON.stringify(peerInfo));
		return setup.setupChainWithPeer(client, ORGS, peerInfo, true, eventhubs, true);

	}).then((readyChain) => {
		logger.debug('Successfully setup chain %s', readyChain.getName());
		chain = readyChain;
		var options = { 
			path: util.storePathForOrg(util.getOrgNameByOrg(ORGS, org)) 
		};
		return hfc.newDefaultKeyValueStore(options);
		
	}).then((keyValueStore) => {
		client.setStateStore(keyValueStore);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		return sendTransactionProposal(chain, admin, util.getMspid(ORGS, org), traceInfo, tx_id);

	}).then((results) => {
		if (util.checkProposalResponses(results, 'Invoke transaction', logger)) {
			var proposalResponses = results[0];
			var proposal = results[1];
			var header   = results[2];
			logger.debug('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', 
					proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);

			return commitTransaction(chain, proposalResponses, proposal, header, eventhubs, tx_id.value);
		} else {
			util.throwError(logger, null, 'Bad proposal responses. ');
		}
	}).catch((err) => {
		logger.error('Failed to invoke transaction with error: ' + err.stack ? err.stack : err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


function printSuccessHint(tx_id) {
	logger.info('Successfully committed transaction to the orderer.');
	logger.info('******************************************************************');
	logger.info('To manually run query.js, set the following environment variables:');
	logger.info('E2E_TX_ID='+'\''+tx_id+'\'');
	logger.info('******************************************************************');
}


function processCommitResponse(responses, tx_id) {
	logger.debug('Successfully get transaction commit response: %s', JSON.stringify(responses));
	
	try {
		// First returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
		let response = responses[0];
		
		if(response) {
			// Sending transactionId back to routes.js
			logger.info('Invoke transaction event promise all complete.');
			return finishCommit(response, logger, tx_id);
		}
		
	} catch(err) {
		util.throwError(logger, err, 'Failed to process commit response. ');
	}
}


function registerTxEvent(eh, resolve, reject, expireTime, deployId) {
	let handle = setTimeout(reject, expireTime);

	logger.debug('registerTxEvent with deployId %s ', deployId);

	eh.registerTxEvent(deployId, (tx, code) => {
		txEventListener(eh, resolve, reject, handle, deployId);
	});
}


function sendInstantiateProposal(chain, admin, mspid, tx_id) {
	admin.mspImpl._id = mspid;

	var nonce = ClientUtils.getNonce();
	tx_id.value = chain.buildTransactionID(nonce, admin);

	var request = generateInvokeRequest('init', nonce, tx_id.value, "this is genesis block");
	logger.debug('Sending instantiate proposal "%s"', JSON.stringify(request));

	return chain.sendInstantiateProposal(request);
}


function sendTransactionProposal(chain, admin, mspid, traceInfo, tx_id) {
	admin.mspImpl._id = mspid;

	var nonce = ClientUtils.getNonce();
	tx_id.value = chain.buildTransactionID(nonce, admin);

	var request = generateInvokeRequest('addNewTrade', nonce, tx_id.value, traceInfo);
	logger.debug('Sending invoke transaction proposal "%s"', JSON.stringify(request));

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
	logger.debug('The transaction has been committed on peer '+ eh.ep.addr);
	resolve();	
}
