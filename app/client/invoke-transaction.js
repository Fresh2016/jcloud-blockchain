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
//var queryClient = require('./query.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('invoke-chaincode');
var ORGS = util.ORGS;

var tx_id = null;
var nonce = null;
var the_user = null;
var allEventhubs = [];
var targets = [];
var eventhubs = [];

/*TODO: there's a bug that peer down causes grpc emitting error event and nobody handles it, result in program panic.
events.js:160
      throw er; // Unhandled 'error' event
      ^

Error: Connect Failed
    at ClientDuplexStream._emitStatusIfDone (D:\eclipse-workspace\jcloud-blockchain\node_modules\grpc\src\node\src\client.js:201:19)
    at ClientDuplexStream._readsDone (D:\eclipse-workspace\jcloud-blockchain\node_modules\grpc\src\node\src\client.js:169:8)
    at readCallback (D:\eclipse-workspace\jcloud-blockchain\node_modules\grpc\src\node\src\client.js:229:12)
*/

module.exports.invokeChaincode = function(traceInfo, callback) {
	logger.info('\n\n***** Hyperledger fabric client: invoke chaincode *****');
	
	// this is a transaction, will just use org1's identity to
	// submit the request
	var client = new hfc();
	var org = 'org1';
	var orgName = util.getOrgNameByOrg(ORGS, org);
	var chain = setup.setupChainWithEventbus(client, eventhubs, allEventhubs, ORGS, orgName, org);

	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)

	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		return sendTransactionProposal(chain, admin, util.getMspid(ORGS, org), traceInfo);

	}).then((results) => {
		if (util.checkProposalResponses(results, 'Invoke transaction', logger)) {
			var proposalResponses = results[0];
			var proposal = results[1];
			var header   = results[2];
			logger.debug('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', 
					proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);
			commitTransaction(chain, proposalResponses, proposal, header);
		}
	}).then((response) => {
		if(response) {
			callback(finishCommit(response, logger, tx_id));
		} else {
			util.throwError(logger, null, 'Failed to order the transaction, commit response is null.');
		}
		logger.info('END of invoke transaction.');
	}).catch((err) => {
		logger.error('Failed to send invoke proposal or commit transaction with error:' + err.stack ? err.stack : err);
		callback({TransactionId : null});
		logger.info('END of invoke transaction.');
	});
};


function addTxPromise(eventPromises, eh, deployId) {
	let txPromise = new Promise((resolve, reject) => {
		// set expireTime as 30s
		registerTxEvent(eh, resolve, reject, 30000, deployId);
	});
	eventPromises.push(txPromise);
}


function commitTransaction(chain, proposalResponses, proposal, header){
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
		logger.info('Invoke transaction event promise all complete.');
		return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call

	}).catch((err) => {
		util.throwError(logger, err, 'Failed to send invoke transaction and get notifications within the timeout period.');
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


function sendTransactionProposal(chain, admin, mspid, traceInfo) {
	
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
		args: ["Sku", "Sku654321", "TraceInfo", traceInfo],
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
