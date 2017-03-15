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

// This is an end-to-end test that focuses on exercising all parts of the fabric APIs
// in a happy-path scenario
'use strict';

var tape = require('tape');
var _test = require('tape-promise');
var test = _test(tape);

var path = require('path');
var util = require('util');

var hfc = require('fabric-client');
var utils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var testUtil = require('./util.js');

var logger = utils.getLogger('invoke-chaincode');

var e2e = testUtil.END2END;
hfc.addConfigFile(path.join(__dirname, './config.json'));
var ORGS = hfc.getConfigSetting('test-network');

var tx_id = null;
var nonce = null;
var the_user = null;
var allEventhubs = [];

module.exports.invokeChaincode = function(traceInfo) {
	console.log('\n\n***** End-to-end flow: instantiate chaincode *****');
	
	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = 'org1';
	var client = new hfc();
	var chain = client.newChain(e2e.channel);
	chain.addOrderer(new Orderer(ORGS.orderer));

	var orgName = ORGS[org].name;

	var targets = [],
		eventhubs = [];
	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			let peer = new Peer(ORGS[key].peer1.requests);
			chain.addPeer(peer);

			let eh = new EventHub();
			eh.setPeerAddr(ORGS[key].peer1.events);
			eh.connect();
			eventhubs.push(eh);
			allEventhubs.push(eh);
		}
	}

	// remove expired keys before enroll admin
	testUtil.cleanupDir(testUtil.storePathForOrg(orgName));
	
	return hfc.newDefaultKeyValueStore({
		path: testUtil.storePathForOrg(orgName)
	}).then((store) => {

		client.setStateStore(store);
		return testUtil.getSubmitter(client, org);

	}).then((admin) => {

		console.log('Successfully enrolled user \'admin\'');
		the_user = admin;

		the_user.mspImpl._id = ORGS[org].mspid;

		nonce = utils.getNonce();
		tx_id = chain.buildTransactionID(nonce, the_user);

		console.log(util.format('Sending transaction "%s"', tx_id));

		// send proposal to endorser
		// for supplychain
		var request = {
			chaincodeId : e2e.chaincodeId,
			chaincodeVersion : e2e.chaincodeVersion,
			fcn: 'addNewTrade',
			args: ["Sku", "Sku654321", "TraceInfo", traceInfo ],
			chainId: e2e.channel,
			txId: tx_id,
			nonce: nonce
		};
		return chain.sendTransactionProposal(request);

	}, (err) => {

		console.error('Failed to enroll user \'admin\'. ' + err);
		throw new Error('Failed to enroll user \'admin\'. ' + err);

	}).then((results) => {

		var proposalResponses = results[0];

		var proposal = results[1];
		var header   = results[2];
		var all_good = true;
		for(var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
				one_good = true;
				logger.info('transaction proposal was good');
			} else {
				logger.error('transaction proposal was bad');
			}
			all_good = all_good & one_good;
		}
		if (all_good) {
			console.log(util.format('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal,
				header: header
			};
			console.log('request is %s ', JSON.stringify(request));
			
			// set the transaction listener and set a timeout of 30sec
			// if the transaction did not get committed within the timeout period,
			// fail the test
			var deployId = tx_id.toString();

			var eventPromises = [];
			eventhubs.forEach((eh) => {
				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(reject, 30000);

					console.log('registerTxEvent with deployId %s ', deployId.toString());

					eh.registerTxEvent(deployId.toString(), (tx, code) => {
						clearTimeout(handle);
						
						//TODO：目前这里会导致程序异常退出
						//eh.unregisterTxEvent(deployId);
						
						console.log('get callback of deployId %s ', deployId.toString());

						//TODO: 目前这里会返回一个policy不满足的错误码，需要看下证书生成时的设置
						/*
						if (code !== 'VALID') {
							console.error('The balance transfer transaction was invalid, code = ' + code);
							reject();
						} else {
							console.log('The balance transfer transaction has been committed on peer '+ eh.ep.addr);
							resolve();
						}
						*/
						console.log('The balance transfer transaction has been committed on peer '+ eh.ep.addr);
						resolve();
					});
				});

				eventPromises.push(txPromise);
			});

			var sendPromise = chain.sendTransaction(request);
			return Promise.all([sendPromise].concat(eventPromises))
			.then((results) => {

				logger.debug(' event promise all complete and testing complete');
				return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call

			}).catch((err) => {

				console.error('Failed to send transaction and get notifications within the timeout period.');
				throw new Error('Failed to send transaction and get notifications within the timeout period.');

			});

		} else {
			console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
			throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	}, (err) => {

		console.error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);

	}).then((response) => {

		if (response.status === 'SUCCESS') {
			console.log('Successfully sent transaction to the orderer.');
			console.log('******************************************************************');
			console.log('To manually run query.js, set the following environment variables:');
			console.log('E2E_TX_ID='+'\''+tx_id+'\'');
			console.log('******************************************************************');
			var result = {
					TransactionId : tx_id
				};
			return result;			
		} else {
			console.error('Failed to order the transaction. Error code: ' + response.status);
			//throw new Error('Failed to order the transaction. Error code: ' + response.status);
			return 'failed';
		}
	}, (err) => {

		console.error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
		//throw new Error('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
		return 'failed';
	});
};

function disconnectEventhub(context, ehs, f) {
	// Disconnect the event hub
	return function() {
		for(var key in ehs) {
			var eventhub = ehs[key];
			if (eventhub && eventhub.isconnected()) {
				logger.info('Disconnecting the event hub');
				eventhub.disconnect();
			}
		}

		f.apply(context, arguments);
	};
}