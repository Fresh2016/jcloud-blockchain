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

var logger = ClientUtils.getLogger('setup-chain');


// Export functions
module.exports.getAlivePeer = getAlivePeer;
module.exports.setupChain = setupChain;
module.exports.setupChainWithEventbus = setupChainWithEventbus;
module.exports.setupChainWithOnlyPrimaryPeer = setupChainWithOnlyPrimaryPeer;
module.exports.setupChainWithAllPeers = setupChainWithAllPeers;


//Set up the chain with orderer
function addOrderer(chain, ORGS) {
	chain.addOrderer(new Orderer(ORGS.orderer));
}


//Set up the chain with peer
function addPeer(chain, ORGS, peerInfo, asPrimary) {
	var url = peerInfo['requests'];
	let peer = new Peer(url);
	chain.addPeer(peer);
	if (asPrimary) {
		chain.setPrimaryPeer(peer);
	}
}


//Set up the chain with all peers
function addPeerAll(chain, ORGS) {
	var peerList = getPeerAll(ORGS);
	for (let i in peerList) {
		addPeer(chain, ORGS, peerList[i], false);
	}
}


//Set up the chain with eventhub
function connectEventHub(eventhubs, allEventhubs, peerInfo) {
	var eventsUrl = peerInfo['events'];
	let eh = new EventHub();

	eh.setPeerAddr(eventsUrl);
	eh.connect();
	eventhubs.push(eh);
	allEventhubs.push(eh);	
}


function checkTheNext(peerList) {
	// Looking for alive peer recursively and returning its url
	
	// Take one from the list each time, also removing it
	var peer = popRandom(peerList);
	try {
		var peerUrl = peer['requests'];
	} catch(err) {
		var peerUrl = '';
	}
	
	return isPortAlive(getIpFromEndpoint(peerUrl), getPortFromEndpoint(peerUrl))
	.then((res) => {
		logger.debug('Find alive peer %s and returning it.', peerUrl);
		return peer;

	}).catch((err) => {
		logger.debug('Peer %s is not connected, try next.', peerUrl);
		if (0 < peerList.length) {
			return checkTheNext(peerList);
		} else {
			util.throwError(logger, err, 'Failed in getting any alive peer, returning nothing.');
			return null;
		}
	});
}


function cleanupKeyValueStore(ORGS) {
	var orgList = getOrgAll(ORGS);
	for (let i in orgList) {
		var orgName = util.getOrgNameByOrg(ORGS, orgList[i]);
		util.cleanupDir(util.storePathForOrg(orgName));
	}
}


//Simply and quick check port connectivity, so that
//instantiate and invoke will not connect DOWN peer
function getAlivePeer(ORGS, org) {
	var peerList = getPeerByOrg(ORGS, org);
	return checkTheNext(peerList);
}


function getIpFromEndpoint(endpoint) {
	if (endpoint) {
		return endpoint.split('//')[1].split(':')[0];
	} else {
		return null;
	}
}


function getOrgAll(ORGS) {
	// There may be multiple org in ORGS
	return util.getKeyOfJson(ORGS, 'org');
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
	var valueOfPeers = util.getValueOfJson(ORGS[org], 'peer');
	for (let i in valueOfPeers) {
		list.push(valueOfPeers[i]);
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


function isPortAlive(host, port) {
	logger.debug('Checking connectivity of %s:%s', host, port);
	return new Promise((resolve, reject) => {
		net.createConnection(port, host)
		.on("connect", function() {
			resolve(); 
		}).on("error", function() {
			reject();
		});
	}).catch((err) => {
		reject();
	});	
}


function popRandom(list) {
	logger.debug('Poping cell randomly from %s', JSON.stringify(list));
	if (list) {
		var i = getRandom(0, list.length);
		var component = list[i];
		list.splice(i, 1);
		logger.debug('Successfully pop %s, now list becomes %s', JSON.stringify(component), JSON.stringify(list));
		return component;
	} else {
		logger.error('Empty list, return nothing.');
		return null;
	}
}


// Initialize a new chain for specific org with all peers
function setupChain(client, ORGS, orgName, peerOrg) {
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



//Initialize a new chain for specific org with one peer and connect to its eventbus
function setupChainWithEventbus(client, eventhubs, allEventhubs, ORGS, peerInfo, asPrimary) {
	try{
		var chain = setupChainWithOnlyPrimaryPeer(client, ORGS, peerInfo, asPrimary);
		connectEventHub(eventhubs, allEventhubs, peerInfo);

		return chain;
		
	} catch(err) {
		util.throwError(logger, err, 'Failed in setting up chain, check config file.');
		return null;
	}
}


// Initialize a new chain for specific org with only peer1 and as primary peer
function setupChainWithOnlyPrimaryPeer(client, ORGS, peerInfo, asPrimary) {
	try{
		var chain = client.newChain(util.channel);

		addOrderer(chain, ORGS);
		addPeer(chain, ORGS, peerInfo, asPrimary);

		// Remove expired keys before enroll user
		cleanupKeyValueStore(ORGS);

		return chain;
		
	} catch(err) {
		util.throwError(logger, err, 'Failed in setting up chain, check config file.');
		return null;
	}
}


// Initialize a new chain with all peers, with default primary peer
function setupChainWithAllPeers(client, ORGS) {
	try{
		var chain = client.newChain(util.channel);

		addOrderer(chain, ORGS);
		addPeerAll(chain, ORGS);

		// Remove expired keys before enroll user
		cleanupKeyValueStore(ORGS);

		return chain;
		
	} catch(err) {
		util.throwError(logger, err, 'Failed in setting up chain, check config file.');
		return null;
	}
}