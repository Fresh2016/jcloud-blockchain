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

var path = require('path');

var hfc = require('fabric-client');
var ClientUtils = require('fabric-client/lib/utils.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var Peer = require('fabric-client/lib/Peer.js');
var Submitter = require('./get-submitter.js');
var exe = require('./execute-recursively.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('join-channel');
var ORGS = util.ORGS;

module.exports.joinChannel = joinChannel;


function joinChannel() {
	logger.info('\n\n***** Hyperledger fabric client: join channel *****');
	
	var orgs = util.getOrgs(ORGS);
	logger.info('There are %s organizations: %s. Going to join channel one by one.', orgs.length, orgs);

	return exe.executeTheNext(orgs, joinChannelByOrg, 'Join Channel')
	.catch((err) => {
		logger.error('Failed to join channel with error: ' + err.stack ? err.stack : err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


// As different org holds different certs, only peers in the same org can join the channel in once operation
function joinChannelByOrg(org) {
	logger.info('Calling peers in organization "%s" to join the channel', org);

	// client and chain should be claimed here
	var client = new hfc();
	var orgName = util.getOrgNameByOrg(ORGS, org);
	var chain = setup.setupChainByOrg(client, ORGS, orgName, org);
	
	var options = { 
			path: util.storePathForOrg(util.getOrgNameByOrg(ORGS, org)) 
		};

	return hfc.newDefaultKeyValueStore(options)
	.then((keyValueStore) => {
		client.setStateStore(keyValueStore);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');

		//FIXME: temporary fix until mspid is configured into Chain
		admin.mspImpl._id = util.getMspid(ORGS, org);

		var nonce = ClientUtils.getNonce()
		var tx_id = chain.buildTransactionID(nonce, admin);
		var targets = chain.getPeers();
		
		var request = {
			targets : targets,
			txId : 	tx_id,
			nonce : nonce
		};
		logger.debug('Sending join channel request: %j', request);

		return chain.joinChannel(request);

	}).then((responses) => {
		// Check response status and return a new promise if success
		return finishJoinByOrg(responses);

	}).catch((err) => {
		logger.error('Failed to join channel with error: ' + err.stack ? err.stack : err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
}


function finishJoinByOrg(responses) {
	if(responses[0] && responses[0].response && responses[0].response.status == 200) {
		logger.debug('Successfully sent Request and received Response: Status - %s', responses[0].response.status);
		return responses[0];
	}
	else {
		// Seems a bug in Chain.js that it returns error as response
		util.throwError(logger, JSON.stringify(responses), 'Get failure responses: ');
	}
}