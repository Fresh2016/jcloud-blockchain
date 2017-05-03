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

ClientUtils.setConfigSetting('hfc-logging', '{"debug": "console"}');
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
	var orderer = setup.newOrderer(client, ORGS.orderer);

	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = defaultOrg;

	return Submitter.getSubmitter(client, org, logger)
	.then((admin) => {

		logger.info('Successfully enrolled user \'admin\'');

		// read in the envelope to send to the orderer
		return util.readFile(util.txFilePath);
		
	}).then((txFileData) => {
		var request = {
			envelope : txFileData,
			name : util.channel,
			orderer : orderer
		};
		printRequest(logger, request);

		// send to orderer
		return client.createChannel(request);

	}).then((chain) => {
		// Check response status and return a new promise if success
		return finishCreation(chain, orderer, defaultSleepTime);

	}).catch((err) => {
		logger.error('Failed to create the channel with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


function checkOrderer(chain, orderer){
	try {
		var test_orderer = chain.getOrderers()[0];
		if(test_orderer === orderer) {
			logger.debug('Created channel has correct orderer as requested.');
			return true;
		}
	} catch(err) {
		util.throwError(logger, err, 'Incorrect orderer in created chain with err:');
	}
}


function finishCreation(chain, orderer, sleepTime) {
	try {
		logger.debug('Successfully sent Request and received Response: chainname - %s', chain.getName());
		logger.debug('Going to sleep %d sec for waiting creation done.', sleepTime/1000.0);

		if(!checkOrderer(chain, orderer)) {
			util.throwError(logger, null, 'Failed to create the channel. ');
		}

		return sleep(sleepTime)
		.then(() => {
			logger.debug('Successfully waited to make sure new channel was created.');
			logger.info('END of create channel.');
			return chain.getName();
		});
	} catch(err) {
		util.throwError(logger, err, 'Failed to create the channel with err:');
	}
}


function printRequest(logger, request) {
	logger.debug('Successfully read envelop file and sending creation request: \n' + 
			request.name + request.envelope.toString('utf8', 0, 100) + 
			'\n ......\n\n' +
			request.orderer.toString('utf8', 0, 100) + 
			'\n ......\n\n');
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}