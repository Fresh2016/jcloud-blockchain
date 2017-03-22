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
var Orderer = require('fabric-client/lib/Orderer.js');
var Peer = require('fabric-client/lib/Peer.js');
var util = require('./util.js');

// initial a new chain for specific org
module.exports.setupChain = function(client, ORGS, orgName, peerOrg) {
	var chain = client.newChain(util.channel);
	chain.addOrderer(new Orderer(ORGS.orderer));

	// set up the chain to only use peers in the specific org
	for (let key in ORGS[peerOrg]) {
		if (ORGS[peerOrg].hasOwnProperty(key)) {
			if (key.indexOf('peer') === 0) {
				let peer = new Peer(ORGS[peerOrg][key].requests);
				chain.addPeer(peer);
			}
		}
	}

	// remove expired keys before enroll admin
	util.cleanupDir(util.storePathForOrg(orgName));
	
	return chain;
}