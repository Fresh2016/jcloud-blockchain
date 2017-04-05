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
var async = require('async');

var hfc = require('fabric-client');
var ClientUtils = require('fabric-client/lib/utils.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var Peer = require('fabric-client/lib/Peer.js');
var Submitter = require('./get-submitter.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('join-channel');
var ORGS = util.ORGS;

var tx_id = null;
var nonce = null;

module.exports.joinChannel = joinChannel;


//TODO: async should be refactored as promise
function joinChannel(callback) {

	logger.info('\n\n***** Hyperledger fabric client: join channel *****');
	
	var orgs = util.getOrgs(ORGS);
	logger.info('There are %s organizations: %s. Going to join channel one by one.', orgs.length, orgs);

	// Send concurrent proposal
	return async.mapSeries(orgs, function(org, processResults) {
	    joinChannelTemp(org)
		.then(() => {
			logger.info('Successfully joined peers in organization "%s" to the channel', org);
			processResults(null, 'SUCCESS');
		}, (err) => {
			util.throwError(logger, err.stack ? err.stack : err, 
					'Failed to join peers in organization ' + org + ' to the channel');
		}).catch((err) => {
			logger.error('Failed due to unexpected reasons. ' + err.stack ? err.stack : err);
			processResults(null, 'FAILED');
		});

	}, function(err, results) {
		logger.debug('processResults get callback with results %s and err %s.', results, err);
		// callback to routes.js
		callback(results);
		logger.info('END of join channel.');
	});	
};


function joinChannelTemp(org) {
	logger.info('Calling peers in organization "%s" to join the channel', org);

	// Different org uses different client
	var client = new hfc();
	var orgName = util.getOrgNameByOrg(ORGS, org);
	var chain = setup.setupChain(client, ORGS, orgName, org);

	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
	})
	.then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);
	})
	.then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');

		//FIXME: temporary fix until mspid is configured into Chain
		admin.mspImpl._id = util.getMspid(ORGS, org);

		nonce = ClientUtils.getNonce()
		tx_id = chain.buildTransactionID(nonce, admin);
		var targets = chain.getPeers();
		
		var request = {
			targets : targets,
			txId : 	tx_id,
			nonce : nonce
		};
		return chain.joinChannel(request);
	}, (err) => {
		logger.error('Failed to enroll user \'admin\' due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to enroll user \'admin\' due to error: ' + err.stack ? err.stack : err);
	})
	.then((results) => {
		logger.info('Join Channel response: %j', results);

		if(results[0] && results[0].response && results[0].response.status == 200)
			logger.info('Successfully joined channel.');
		else {
			logger.error(' Failed to join channel');
			throw new Error('Failed to join channel');
		}
	}, (err) => {
		logger.error('Failed to join channel due to error: ' + err.stack ? err.stack : err);
	});
}