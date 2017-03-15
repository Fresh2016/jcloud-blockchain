/**
 * Copyright 2017 Jingdong All Rights Reserved.
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

var path = require('path');
var util = require('util');

var hfc = require('fabric-client');
var utils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var testUtil = require('./util.js');

var logger = utils.getLogger('install-chaincode');

var e2e = testUtil.END2END;
hfc.addConfigFile('./app/config/config.json');
var ORGS = hfc.getConfigSetting('test-network');
//console.log('Get ORGS: ');
//console.dir(ORGS);

var tx_id = null;
var nonce = null;
var the_user = null;


module.exports.queryTransaction = function() {
	// this is a transaction, will just use org1's identity to
	// submit the request. intentionally we are using a different org
	// than the one that submitted the "move" transaction, although either org
	// should work properly
	console.log('\n\n***** End-to-end flow: query transaction by tx_id *****');
	
	var org = 'org2';
	var client = new hfc();
	var chain = client.newChain(e2e.channel);

	var orgName = ORGS[org].name;

	var targets = [];
	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			let peer = new Peer(ORGS[key].peer1.requests);
			chain.addPeer(peer);
			//console.log('喔～ key is %s, org is %s', key, org);
			if (key == org) {
				console.log('set primary peer: %s', JSON.stringify(peer));
				chain.setPrimaryPeer(peer);
			}
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
		the_user = admin;
		the_user.mspImpl._id = ORGS[org].mspid;

		nonce = utils.getNonce();
		tx_id = chain.buildTransactionID(nonce, the_user);

		// use default primary peer
		// send query
		return chain.queryBlock(0);
	},
	(err) => {
		console.error('Failed to get submitter \'admin\'');
		console.error('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
		return 'failed';
	})
	
	.then((block) => {
		logger.info(' Chain getBlock() returned block number=%s',block.header.number);
		logger.info('checking query results are correct that we got zero block back: %s', block.header.number.toString());

		//TODO: pass id from web ui
		tx_id = '6dec5d177400e712f3f32c86ddd55b94080a55834485ca3a76710ee70935876c';
		if (tx_id === 'notfound') {
			logger.info('Transaction ID not found.');
			throw new Error('Transaction ID not found');
		} else {
			logger.info('Got tx_id %s', tx_id);
			// send query
			return chain.queryTransaction(tx_id); //assumes the end-to-end has run first
		}
	}).then((processed_transaction) => {
		// set to be able to decode grpc objects
		var grpc = require('grpc');
		var commonProto = grpc.load('./node_modules/fabric-client/lib/protos/common/common.proto').common;
		var transProto = grpc.load('./node_modules/fabric-client/lib/protos/peer/transaction.proto').protos;
		logger.info('Chain queryTransaction() returned processed tranaction validationCode: ' + processed_transaction.validationCode);
		logger.info('  got back ProcessedTransaction with code: %s', processed_transaction.validationCode);

		try {
			var payload = commonProto.Payload.decode(processed_transaction.transactionEnvelope.payload);
			var channel_header = commonProto.ChannelHeader.decode(payload.header.channel_header);
			logger.debug(' Chain queryTransaction - transaction ID :: %s:', channel_header.tx_id);
		}
		catch(err) {
			logger.error(err);
			throw new Error(err.stack ? err.stack : err);
		}

		//chain.setPrimaryPeer(peer1);
		// send query
		return chain.queryInfo();
	}).then((blockchainInfo) => {
		logger.info('got back blockchain info ');
		logger.info(' Chain queryInfo() returned block height='+blockchainInfo.height);
		logger.info(' Chain queryInfo() returned block previousBlockHash='+blockchainInfo.previousBlockHash);
		logger.info(' Chain queryInfo() returned block currentBlockHash='+blockchainInfo.currentBlockHash);
		var block_hash = blockchainInfo.currentBlockHash;
		var result = {
				previousBlockHash : blockchainInfo.previousBlockHash,
				currentBlockHash : blockchainInfo.currentBlockHash
				//previousBlockHash : blockchainInfo.previousBlockHash.toString('utf8'),
				//currentBlockHash : blockchainInfo.currentBlockHash.toString('utf8')
			};
		return result;		
		
/*		
		// send query
		return chain.queryBlockByHash(block_hash);
	}).then((block) => {
		logger.info(' Chain queryBlockByHash() returned block number=%s',block.header.number);
		logger.info('got back block number '+ block.header.number);
	})
*/	
	
	
	
	},
	(err) => {
		console.error('Failed to send query due to error: ' + err.stack ? err.stack : err);
		return 'failed';
	}).catch((err) => {
		console.error('Failed to end to end test with error:' + err.stack ? err.stack : err);
		return 'failed';
	});
}

module.exports.queryByChaincode = function() {
	// this is a transaction, will just use org1's identity to
	// submit the request. intentionally we are using a different org
	// than the one that submitted the "move" transaction, although either org
	// should work properly
	console.log('\n\n***** End-to-end flow: query chaincode *****');
	
	var org = 'org2';
	var client = new hfc();
	var chain = client.newChain(e2e.channel);

	var orgName = ORGS[org].name;

	var targets = [];
	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			let peer = new Peer(ORGS[key].peer1.requests);
			chain.addPeer(peer);
			//console.log('喔～ key is %s, org is %s', key, org);
			if (key == org) {
				console.log('set primary peer: %s', JSON.stringify(peer));
				chain.setPrimaryPeer(peer);
			}
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
		the_user = admin;
		the_user.mspImpl._id = ORGS[org].mspid;

		nonce = utils.getNonce();
		tx_id = chain.buildTransactionID(nonce, the_user);

		// send query
		// for supplychain
		var request = {
			chaincodeId : e2e.chaincodeId,
			chaincodeVersion : e2e.chaincodeVersion,
			chainId: e2e.channel,
			txId: tx_id,
			nonce: nonce,
			fcn: 'queryTrade',
			args: ["TransactionId", "Sku", "TradeDate", "TraceInfo"]
		};

		return chain.queryByChaincode(request);
	},
	(err) => {
		console.error('Failed to get submitter \'admin\'');
		console.error('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
		return 'failed';
	}).then((response_payloads) => {
		console.log('Query results: %s' + response_payloads);
		if (response_payloads) {
			for(let i = 0; i < response_payloads.length; i++) {
				console.log('Query results [' + i + ']: %s' + response_payloads[i]);
				var res_list = response_payloads[i].toString('utf8').split(',');
				var result = {
						TransactionId : res_list[0],
						Sku : res_list[1],
						TradeDate: res_list[2],
						TraceInfo: res_list[3],
						counter: res_list[4]
					};
				return result;
			}
			return 'failed';
		} else {
			console.error('response_payloads is null');
			return 'failed';
		}
	},
	(err) => {
		console.error('Failed to send query due to error: ' + err.stack ? err.stack : err);
		return 'failed';
	}).catch((err) => {
		console.error('Failed to end to end test with error:' + err.stack ? err.stack : err);
		return 'failed';
	});
}