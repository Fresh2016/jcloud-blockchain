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
var Listener = require('./listen-event.js');
var exe = require('./execute-recursively.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('join-channel');

module.exports.joinChannel = joinChannel;


//Check response status and return a new promise if success
function finishJoinByOrg(responses) {
	if(responses[0] && responses[0][0] && responses[0][0].response && responses[0][0].response.status == 200) {
		logger.debug('Successfully sent Request and received Response: Status - %s', responses[0][0].response.status);
		return responses[0][0];
	}
	else {
		// Seems a bug in Chain.js that it returns error as response
		util.throwError(logger, JSON.stringify(responses), 'Get failure responses: ');
	}
}


function joinChannel(params) {
	logger.info('\n\n***** Hyperledger fabric client: join channel *****');
	var ORGS = util.getNetwork(params);
	var orgs = util.getOrgs(ORGS);
	logger.info('There are %s organizations: %s. Going to join channel one by one.', orgs.length, orgs);

	return exe.executeTheNext(orgs, joinChannelByOrg, params, 'Join Channel')
	.catch((err) => {
		logger.error('Failed to join channel with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


// As different org holds different certs, only peers in the same org can join the channel in once operation
function joinChannelByOrg(org, params) {
	logger.info('Calling peers in organization "%s" to join the channel', org);

	// client and chain should be claimed here
	var client = new hfc();
	var eventhubs = [];
	var channel = util.getChannel(params);
	var ORGS = util.getNetwork(params);
	var chain = setup.setupChainByOrg(client, channel, ORGS, org, eventhubs, true);

	return Submitter.getSubmitter(client, ORGS, org, logger)
	.then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		return sendJoinProposal(chain, channel, admin, eventhubs);
 
	}).catch((err) => {
		logger.error('Failed to join channel with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
}


function sendJoinProposal(chain, channel, admin, eventhubs) {
	var nonce = ClientUtils.getNonce()
	var tx_id = hfc.buildTransactionID(nonce, admin);
	var targets = chain.getPeers();

	var request = {
		targets : targets,
		txId : 	tx_id,
		nonce : nonce
	};
	logger.debug('Sending join channel request: %j', request);

	var eventPromises = [];
	eventhubs.forEach((eh) => {
		Listener.addPromise(eventPromises, 'block', eh, tx_id, channel);
	});	

	var sendPromise = chain.joinChannel(request);
	return Promise.all([sendPromise].concat(eventPromises))
	.then((results) => {
		return finishJoinByOrg(results);
	}).then((results) => {
		return Listener.disconnectEventhub(eventhubs);
	}).catch((err) => {
		// Assure Eventhub will be disconnected when expired
		Listener.disconnectEventhub(eventhubs);
		util.throwError(logger, err, 'Failed to join channel and get notifications within the timeout period.');
	});	
}
