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

var net = require('net');

var ClientUtils = require('fabric-client/lib/utils.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('invoke-chaincode');


// Simply and quick check port connectivity, so that
// instantiate and invoke will not connect DOWN peer
module.exports.getAlivePeer = function(ORGS, org) {
	var peerList = getPeerByOrg(ORGS, 'org2');
	return checkTheNext(peerList);
}


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
				if (key == peerOrg) {
					chain.setPrimaryPeer(peer);
				}
			}

			connectEventHub(eventhubs, allEventhubs, ORGS[key].peer1.events);
			connectEventHub(eventhubs, allEventhubs, ORGS[key].peer2.events);
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


function connectEventHub(eventhubs, allEventhubs, peerAddr) {
	let eh = new EventHub();
	eh.setPeerAddr(peerAddr);
	eh.connect();
	eventhubs.push(eh);
	allEventhubs.push(eh);	
}


function checkTheNext(peerList) {
	// Looking for alive peer recursively and returning its url
	
	// Take one from the list each time, also removing it
	var peer = popRandom(peerList);
	
	return isPortAlive(getIpFromEndpoint(peer), getPortFromEndpoint(peer))
	.then((res) => {
		logger.debug('Find alive peer and returning its url: %s', peer);
		return peer;

	}).catch((err) => {
		logger.debug('Peer %s is not connected, try next.', peer);
		if (0 < peerList.length) {
			return checkTheNext(peerList);
		} else {
			logger.debug('Failed in getting any alive peer, returning nothing.');
			return null;
		}
	});
}


function getIpFromEndpoint(endpoint) {
	if (endpoint) {
		return endpoint.split('//')[1].split(':')[0];
	} else {
		return null;
	}
}


//Return all keys matches keyword, not strictly
function getKeyOfJson(jsonObj, keyword) {
	var list = [];
	for (let key in jsonObj) {
		if (jsonObj.hasOwnProperty(key)) {
			if (key.indexOf(keyword) === 0) {
				list.push(key);
			}
		}
	}
	return list;
}


function getOrgAll(ORGS) {
	// There may be multiple org in ORGS
	return getKeyOfJson(ORGS, 'org');
}


function getPeerAll(ORGS) {
	var list = [];
	var orgList = getOrgAll(ORGS);
	for (let i in orgList) {
		list = list.concat(getPeerByOrg(ORGS, orgList[i]));
	}
	return list;
}


function getPeerByOrg(ORGS, org) {
	var list = [];
	// There may be multiple peers in an org
	var valueOfPeers = getValueOfJson(ORGS[org], 'peer');
	for (let i in valueOfPeers) {
		list.push(valueOfPeers[i]['requests']);
	}
	return list;
}


function getPortFromEndpoint(endpoint) {
	if (endpoint) {
		return endpoint.split('//')[1].split(':')[1];
	} else {
		return null;
	}
}


function getRandom(n,m){
	// Equal possibility of generating integer in [n,m)
	// Notice m is open and not included in output
	return Math.floor(Math.random()*(m-n)+n);
}


//Return all values matches keyword, not strictly
function getValueOfJson(jsonObj, keyword) {
	var list = [];
	for (let key in jsonObj) {
		if (jsonObj.hasOwnProperty(key)) {
			if (key.indexOf(keyword) === 0) {
				list.push(jsonObj[key]);
			}
		}
	}
	return list;
}


function isPortAlive(host, port) {
	logger.debug('Checking connectivity of %s:%s', host, port);
	return new Promise((resolve, reject) => {
		net.createConnection(port, host)
		.on("connect", function(e) {
			resolve(); 
		}).on("error", function(e) {
			reject();
		});
	}).catch((err) => {
		reject();
	});	
}


function popRandom(list) {
	logger.debug('Poping cell randomly from %s', list);
	if (list) {
		var i = getRandom(0, list.length);
		var component = list[i];
		list.splice(i, 1);
		logger.debug('Successfully pop %s, now list becomes %s', component, list);
		return component;
	} else {
		logger.error('Empty list, return nothing.');
		return null;
	}
}

/*
function printArg(arg) {
	logger.debug('printArg is called back');
	logger.debug(arg);
}

function doItFirst() {
	return new Promise((resolve, reject) => {
		resolve();
	}).catch((err) => {
		logger.debug('caught an err 2');
		reject();
	});	
}
*/