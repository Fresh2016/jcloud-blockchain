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

//Only for creating a key value store with org name, not used in create-channel
var defaultOrg = 'org1';

module.exports.createChannel = createChannel;

function createChannel() {
	logger.info('\n\n***** Hyperledger fabric client: create channel via %s *****', org);

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
		the_user = admin;

		//FIXME: temporary fix until mspid is configured into Chain
		the_user.mspImpl._id = util.getMspid(ORGS, org);

		// readin the envelope to send to the orderer
		return util.readFile(util.txFilePath);
		
	}).then((txFileData) => {
		logger.info('Successfully read file');
		var request = {
			envelope : txFileData
		};
		// send to orderer
		return chain.createChannel(request);
	}).then((response) => {
		finishCreation(response, 5000);

	}).then((nothing) => {
		logger.info('Successfully waited to make sure new channel was created.');
		logger.info('END of invoke transaction.');
	}).catch((err) => {
		logger.error('Failed to create the channel with error:' + err.stack ? err.stack : err);
		callback();
		logger.info('END of invoke transaction.');
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