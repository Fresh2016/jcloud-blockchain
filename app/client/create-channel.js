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
var Submitter = require('./get-submitter.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('create-channel');
var ORGS = util.ORGS;

//Only for creating a key value store with org name, not used in create-channel
var defaultOrg = 'org1';
var defaultSleepTime = 1000;

module.exports.createChannel = createChannel;

function createChannel() {
	logger.info('\n\n***** Hyperledger fabric client: create channel *****');

	// client and chain should be claimed here
	var client = new hfc();
	var chain = setup.setupChainWithOnlyOrderer(client, ORGS);

	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = defaultOrg;
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

		// read in the envelope to send to the orderer
		return util.readFile(util.txFilePath);
		
	}).then((txFileData) => {
		var request = {
			envelope : txFileData
		};
		logger.debug('Successfully read envelop file and sending creation request: ' + 
				request.envelope.toString('utf8', 0, 100) + '\n ......');

		// send to orderer
		return chain.createChannel(request);

	}).then((response) => {
		// Check response status and return a new promise if success
		return finishCreation(response, defaultSleepTime);

	}).catch((err) => {
		logger.error('Failed to create the channel with error: ' + err.stack ? err.stack : err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


function finishCreation(response, sleepTime) {
	if (response && response.status === 'SUCCESS') {
		logger.debug('Successfully sent Request and received Response: Status - %s', response.status);
		logger.debug('Going to sleep %d sec for waiting creation done.', sleepTime/1000.0);

		return sleep(sleepTime)
		.then(() => {
			logger.debug('Successfully waited to make sure new channel was created.');
			logger.info('END of create channel.');
			return response;
		});
	} else {
		util.throwError(logger, null, 'Failed to create the channel: ');
	}
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}