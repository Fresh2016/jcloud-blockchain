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
//var util = require('util');

var hfc = require('fabric-client');
var ClientUtils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('install-chaincode');
var ORGS = util.ORGS;

var tx_id = null;
var nonce = null;
var the_user = null;

module.exports.installChaincode = function() {
	// this is a transaction, will just use org1's identity to
	// submit the request. intentionally we are using a different org
	// than the one that submitted the "move" transaction, although either org
	// should work properly
	var org = 'org2';
	var client = new hfc();
	var chain = client.newChain(util.channel);

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

	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
	})
	.then((store) => {

		client.setStateStore(store);
		return Submitter.getSubmitter(client, org);

	})
	.then((admin) => {
		the_user = admin;
		the_user.mspImpl._id = ORGS[org].mspid;

		nonce = ClientUtils.getNonce()
		tx_id = chain.buildTransactionID(nonce, the_user);

		return chain.queryInfo();
	},
	(err) => {
		t.comment('Failed to get submitter \'admin\'');
		t.fail('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
		t.end();
	})
	.then((response_payloads) => {
		t.pass('Block height: low ' + response_payloads.height.low + ' - high ' + response_payloads.height.high);
		console.log('	currentBlockHash: %s', JSON.stringify(response_payloads.currentBlockHash.buffer));
		return response_payloads.height.low;
	},
	(err) => {
		t.fail('Failed to send query due to error: ' + err.stack ? err.stack : err);
		t.end();
	}).catch((err) => {
		t.fail('Failed to end to end test with error:' + err.stack ? err.stack : err);
		t.end();
	})
	.then((height) => {
		console.log('Querying block #: %s', height-1);
		return chain.queryBlock(height-1);
	},
	(err) => {
		t.comment('Failed to get submitter \'admin\'');
		t.fail('Failed to get submitter \'admin\'. Error: ' + err.stack ? err.stack : err );
		t.end();
	})
	.then((response_payloads) => {
		t.pass('Block header number: ' + JSON.stringify(response_payloads.header.number));
		console.log('	previousBlockHash: %s', JSON.stringify(response_payloads.header.previous_hash.buffer));
		//console.log('query result: %s', JSON.stringify(response_payloads));
		t.end();
	},
	(err) => {
		t.fail('Failed to send query due to error: ' + err.stack ? err.stack : err);
		t.end();
	}).catch((err) => {
		t.fail('Failed to end to end test with error:' + err.stack ? err.stack : err);
		t.end();
	});
};