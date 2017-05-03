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
module.exports.getPeerAll = getPeerAll;
module.exports.newOrderer = newOrderer;
module.exports.setupChainByOrg = setupChainByOrg;
module.exports.setupChainWithOnlyOrderer = setupChainWithOnlyOrderer;
module.exports.setupChainWithPeer = setupChainWithPeer;
module.exports.setupChainWithAllPeers = setupChainWithAllPeers;


//Set up the chain with orderer
function addOrderer(client, chain, ORGS) {
	try {
		chain.addOrderer(newOrderer(client, ORGS.orderer));
	} catch(err) {
		logger.error('Orderer of network %j is unrecognized, skip adding it to the chain.', ORGS);
	}
}


// Set up the chain with peer
// Check peer connectivity then add alive one to the chain
function addPeer(client, chain, ORGS, peerInfo, asPrimary) {
	var url = null;
	var peer = null;

	try {
		url = peerInfo['requests'];
		peer = newPeer(client, ORGS, peerInfo);
	} catch(err) {
		logger.warn('Peer %j is unrecognized, skip adding it to the chain.', peerInfo);
	}

	isPortAlive(getIpFromEndpoint(url), getPortFromEndpoint(url))
	.then((res) => {
		chain.addPeer(peer);
		if (asPrimary) {
			chain.setPrimaryPeer(peer);
		}

	}).catch((err) => {
		logger.warn('Peer %s is unreachable, skip adding it to the chain.', url);
	});

}


//Set up the chain with all peers
function addPeerAll(client, chain, ORGS) {
	var peerList = getPeerAll(ORGS);
	for (let i in peerList) {
		addPeer(client, chain, ORGS, peerList[i], false);
	}
}


//Set up the chain with peers in org
function addPeerByOrg(client, chain, ORGS, org) {
	var peerList = getPeerByOrg(ORGS, org);
	for (let i in peerList) {
		addPeer(client, chain, ORGS, peerList[i], false);
	}
}


// Check peer connectivity then connect alive one with eventhub
function connectEventHub(eventhubs, peerInfo) {
	var eh = new EventHub();
	var eventsUrl = null;
	var peerUrl = null;
	var caroots = null;
	var eventsPem = {};

	try {
		eventsUrl = peerInfo['events'];
		peerUrl = peerInfo['requests'];
		caroots = util.getCaRoots(peerInfo);
		eventsPem = {
				pem: caroots,
				'ssl-target-name-override': peerInfo['server-hostname']
			};
	} catch(err) {
		logger.warn('Peer %j is unrecognized, skip connecting it to eventHub.', peerInfo);
	}

	isPortAlive(getIpFromEndpoint(peerUrl), getPortFromEndpoint(peerUrl))
	.then((res) => {
		eh.setPeerAddr(eventsUrl, eventsPem);
		eh.connect();
		eventhubs.push(eh);

	}).catch((err) => {
		logger.warn('Peer %s is unreachable, skip connecting it to eventHub.', peerUrl);
	});
}


//Set up the chain with eventhub
function connectEventHubAll(eventhubs, ORGS) {
	var peerList = getPeerAll(ORGS);
	for (let i in peerList) {
		connectEventHub(eventhubs, peerList[i]);
	}
}


//Set up the chain with eventhub
function connectEventHubByOrg(eventhubs, ORGS, org) {
	var peerList = getPeerByOrg(ORGS, org);
	for (let i in peerList) {
		connectEventHub(eventhubs, peerList[i]);
	}
}


// Looking for alive peer recursively and returning its url
function checkTheNext(peerList) {
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
	// Only consider anchor peers
	var peerList = getAnchorPeerByOrg(ORGS, org);
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


function getAnchorPeerByOrg(ORGS, org) {
	var list = [];
	// There may be multiple anchor peers in an org
	var valueOfPeers = util.getValueOfJson(ORGS[org], 'peer');
	for (let i in valueOfPeers) {
		var isAnchorPeer = JSON.parse(util.getValueOfJson(valueOfPeers[i], 'isAnchor'));
		if(isAnchorPeer) {
			list.push(valueOfPeers[i]);
		}
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

		socket = net.createConnection(port, host);
		
		socket.on("connect", function() {
			socket.destroy();
			resolve();
		}).on("error", function() {
			socket.destroy();
			reject();
		}).on("end", function() {
			logger.debug('Connectivity inspector disconnected from %s:%s', host, port);
		}).on("close", function() {
			logger.debug('Connectivity inspector disconnected from %s:%s', host, port);
		});
	});
}


//Set up the client with orderer
function newOrderer(client, ordererInfo) {
	var caroots = util.getCaRoots(ordererInfo);

	return client.newOrderer(
			ordererInfo.url,
			{
				'pem': caroots,
				'ssl-target-name-override': ordererInfo['server-hostname']
			}
		);
}


//Set up the client with peer
function newPeer(client, ORGS, peerInfo) {
	var caroots = util.getCaRoots(peerInfo);
	
	return client.newPeer(
			peerInfo.requests,
			{
				pem: caroots,
				'ssl-target-name-override': peerInfo['server-hostname']
			}
		);
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
// Used in operation: join channel, install chaincode
function setupChainByOrg(client, channel, ORGS, org, eventhubs, withEh) {
	try{
		var chain = client.newChain(channel);

		addOrderer(client, chain, ORGS);
		addPeerByOrg(client, chain, ORGS, org);

		if (withEh) {
			connectEventHubByOrg(eventhubs, ORGS, org);
		}

		// Remove expired keys before enroll user
		cleanupKeyValueStore(ORGS);
		
		return chain;

	} catch(err) {
		util.throwError(logger, err, 'Failed in setting up chain, check config file.');
		return null;
	}
}


// Initialize a new chain only orderer (TODO: in future should be orderers)
// Used in operation: create channel
function setupChainWithOnlyOrderer(client, channel, ORGS) {
	try{
		var chain = client.newChain(channel);

		addOrderer(client, chain, ORGS);

		// Remove expired keys before enroll user
		cleanupKeyValueStore(ORGS);

		return chain;
		
	} catch(err) {
		util.throwError(logger, err, 'Failed in setting up chain, check config file.');
		return null;
	}
}


// Initialize a new chain for specific org with specific peer,
// options include if the peer works as primary peer, and if it connectes to eventhubs
// Used in operation: invoke chaincode, query***
function setupChainWithPeer(client, channel, ORGS, peerInfo, asPrimary, eventhubs, withEh) {
	try{
		var chain = client.newChain(channel);

		addOrderer(client, chain, ORGS);
		addPeer(client, chain, ORGS, peerInfo, asPrimary);
		
		if (withEh) {
			connectEventHub(eventhubs, peerInfo);
		}

		// Remove expired keys before enroll user
		cleanupKeyValueStore(ORGS);

		return chain;
		
	} catch(err) {
		util.throwError(logger, err, 'Failed in setting up chain, check config file.');
		return null;
	}
}


// Initialize a new chain with all peers, with default primary peer.
// Note it could be used only in case that does not require MSP identity,
// such as queryPeers. Otherwise wrong identity error occurs.
// Used in operation: instantiate chaincode, queryPeers
function setupChainWithAllPeers(client, channel, ORGS, eventhubs) {
	try{
		var chain = client.newChain(channel);

		addOrderer(client, chain, ORGS);
		addPeerAll(client, chain, ORGS);

		connectEventHubAll(eventhubs, ORGS);
		
		// Remove expired keys before enroll user
		cleanupKeyValueStore(ORGS);

		return chain;
		
	} catch(err) {
		util.throwError(logger, err, 'Failed in setting up chain, check config file.');
		return null;
	}
}