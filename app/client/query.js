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
hfc.addConfigFile('../config/config.json');
var ORGS = hfc.getConfigSetting('test-network');

var tx_id = null;
var nonce = null;
var the_user = null;

module.exports.query = function() {
	// this is a transaction, will just use org1's identity to
	// submit the request. intentionally we are using a different org
	// than the one that submitted the "move" transaction, although either org
	// should work properly
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
		return testUtil.getSubmitter(client, true, org);

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
		if (response_payloads) {
			for(let i = 0; i < response_payloads.length; i++) {
				console.log('Query results [' + i + ']: %s' + response_payloads[i]);
				return ('Query results [' + i + ']: %s' + response_payloads[i]);
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