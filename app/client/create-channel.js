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
var Submitter = require('./get-submitter.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('create-channel');
var ORGS = util.ORGS;

var the_user = null;
var targets = [];
var client = new hfc();
var chain = client.newChain(util.channel);

module.exports.createChannel = createChannel;

function createChannel(org) {
	logger.info('\n\n***** Hyperledger fabric client: create channel via %s *****', org);

	var orgName = util.getOrgNameByOrg(ORGS, org);
	chain.addOrderer(new Orderer(ORGS.orderer));

	// remove expired keys before enroll admin
	util.cleanupDir(util.storePathForOrg(orgName));

	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
	})
	.then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);
		
	})
	.then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		the_user = admin;

		//FIXME: temporary fix until mspid is configured into Chain
		the_user.mspImpl._id = util.getMspid(ORGS, org);

		// readin the envelope to send to the orderer
		return util.readFile(util.txFilePath);
		
	}, (err) => {
		util.throwError(logger, err, 'Failed to enroll user \'admin\'. ');
		
	})
	.then((txFileData) => {
		logger.info('Successfully read file');
		var request = {
			envelope : txFileData
		};
		// send to orderer
		return chain.createChannel(request);
	}, (err) => {
		util.throwError(logger, err, 'Failed to read file for channel template: ');
		
	})
	.then((response) => {
		finishCreation(response, 5000);

	}, (err) => {
		util.throwError(logger, err, 'Failed to create the channel: ');
		
	})
	.then((nothing) => {
		logger.info('Successfully waited to make sure new channel was created.');
		return 'SUCCESS';
	}, (err) => {
		logger.error('Failed to sleep due to error: ' + err.stack ? err.stack : err);
		return 'FAILED';
	});
};


function finishCreation(response, sleepTime) {
	logger.debug('Successfully sent Request and received Response: Status - %s', response.status);

	if (response && response.status === 'SUCCESS') {
		logger.info('Successfully created the channel.');
		sleep(sleepTime);
	} else {
		util.throwError(logger, err, 'Failed to create the channel: ');
	}
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
