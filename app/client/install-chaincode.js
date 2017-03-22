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

var path = require('path');
var async = require('async');

var hfc = require('fabric-client');
var ClientUtils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var Submitter = require('./get-submitter.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('install-chaincode');
var ORGS = util.ORGS;

var tx_id = null;
var nonce = null;
var the_user = null;
var targets = [];
var client = new hfc();
var chain = client.newChain(util.channel);

// Temporarily set GOPATH to chaincode_repo
process.env.GOPATH = path.join(__dirname, '/chaincode_repo');

module.exports.installChaincode = function(callback) {
	logger.info('\n\n***** Hyperledger fabric client: install chaincode *****');
	
	var orgs = [];
	for (let key in ORGS) {
		if (ORGS.hasOwnProperty(key) && typeof ORGS[key].peer1 !== 'undefined') {
			orgs.push(key);
		}
	}
	logger.info('There are %s organizations: %s. Going to install chaincode one by one.', orgs.length, orgs);

	// Send concurrent proposal
	return async.mapSeries(orgs, function(org, processResults) {
	    logger.debug('org: ' + org);
	    
		installChaincode(org)
		.then(() => {
			logger.info('Successfully installed chaincode in peers of organization %s', org);
			processResults(null, 'SUCCESS');
		}, (err) => {
			util.throwError(logger, err.stack ? err.stack : err, 
					'Failed to install chaincode in peers of organization ' + org);
		}).catch((err) => {
			logger.error('Failed due to unexpected reasons. ' + err.stack ? err.stack : err);
			processResults(null, 'FAILED');
		});

	}, function(err, results) {
		logger.debug('processResults get callback with results %s and err %s.', results, err);
		// callback to routes.js
		callback(results);
		logger.info('END of install chaincode.');
	});

}


function installChaincode(org) {

	var orgName = util.getOrgNameByOrg(ORGS, org);

	setupChain(ORGS, orgName, org);
	
	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org);
		
	}).then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		return sendInstallProposal(admin, util.getMspid(ORGS, org));

	},
	(err) => {
		util.throwError(logger, err, 'Failed to enroll user \'admin\'. ');

	}).then((results) => {
		var proposalResponses = results[0];

		//var proposal = results[1];
		//var header   = results[2];
		
		return util.checkProposalResponses(proposalResponses, 'Install chaincode', logger);

	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to send install proposal due to error: ');
	});
}


function sendInstallProposal(admin, mspid) {
	the_user = admin;
	the_user.mspImpl._id = mspid;

	nonce = ClientUtils.getNonce()
	tx_id = chain.buildTransactionID(nonce, the_user);

	// send proposal to endorser
	var request = {
		targets: targets,
		chaincodePath: util.CHAINCODE_PATH,
		chaincodeId: util.chaincodeId,
		chaincodeVersion: util.chaincodeVersion,
		txId: tx_id,
		nonce: nonce
	};

	return chain.sendInstallProposal(request);	
}


function setupChain(ORGS, orgName, peerOrg) {
	// set up the chain with orderer
	if (!chain.getOrderers()) {
		chain.addOrderer(new Orderer(ORGS.orderer));
	}

	// set up the chain to use each org's 'peer1' for
	// both requests and events
	for (let key in ORGS[peerOrg]) {
		if (ORGS[peerOrg].hasOwnProperty(key)) {
			if (key.indexOf('peer') === 0) {
				let peer = new Peer(ORGS[peerOrg][key].requests);
				targets.push(peer);
				chain.addPeer(peer);
			}
		}
	}

	// remove expired keys before enroll admin
	util.cleanupDir(util.storePathForOrg(orgName));
}