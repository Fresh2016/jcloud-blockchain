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
var EventHub = require('fabric-client/lib/EventHub.js');
var util = require('./util.js');

// initial a new chain for specific org with all peers
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



//initial a new chain for specific org with only peer1 with eventbus
module.exports.setupChainWithEventbus = function(client, eventhubs, allEventhubs, ORGS, orgName, peerOrg) {
	// set up the chain with orderer
	var chain = client.newChain(util.channel);
	chain.addOrderer(new Orderer(ORGS.orderer));

	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			let peer = new Peer(ORGS[key].peer1.requests);
			chain.addPeer(peer);
			if (!chain.isValidPeer(peer)) {
				chain.addPeer(peer);
				//console.debug('喔～ key is %s, org is %s', key, peerOrg);
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
	
	return chain;
}


//initial a new chain for specific org with only peer1 and as primary peer
module.exports.setupChainWithOnlyPrimaryPeer = function(client, ORGS, orgName, peerOrg) {
	// set up the chain with orderer
	var chain = client.newChain(util.channel);
	chain.addOrderer(new Orderer(ORGS.orderer));
	
	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			let peer = new Peer(ORGS[key].peer1.requests);
			if (!chain.isValidPeer(peer)) {
				chain.addPeer(peer);
				//logger.debug('喔～ key is %s, org is %s', key, peerOrg);
				if (key == peerOrg) {
					chain.setPrimaryPeer(peer);
				}
			}
		}
	}
	
	// remove expired keys before enroll admin
	util.cleanupDir(util.storePathForOrg(orgName));
	
	return chain;
}


//initial a new chain with all peers
module.exports.setupChainWithAllPeers = function(client, ORGS, orgName) {
	var chain = client.newChain(util.channel);
	chain.addOrderer(new Orderer(ORGS.orderer));

	// set up the chain to use all peers of all orgs
	for (peerOrg in ORGS) {
		for (let key in ORGS[peerOrg]) {
			if (ORGS[peerOrg].hasOwnProperty(key)) {
				if (key.indexOf('peer') === 0) {
					let peer = new Peer(ORGS[peerOrg][key].requests);
					chain.addPeer(peer);
				}
			}
		}
	}

	// remove expired keys before enroll admin
	util.cleanupDir(util.storePathForOrg(orgName));
	
	return chain;
}