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

var path = require('path');

var hfc = require('fabric-client');
var ClientUtils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var Submitter = require('./get-submitter.js');
var exe = require('./execute-recursively.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('install-chaincode');

// Temporarily set GOPATH to chaincode_repo
process.env.GOPATH = path.join(__dirname, '/chaincode_repo');

module.exports.installChaincode = installChaincode;


function installChaincode(params) {
	logger.info('\n\n***** Hyperledger fabric client: install chaincode *****');
	
	var ORGS = util.getNetwork(params);
	var orgs = util.getOrgs(ORGS);
	logger.info('There are %s organizations: %s. Going to install chaincode one by one.', orgs.length, orgs);

	return exe.executeTheNext(orgs, installChaincodeByOrg, params, 'Install Chaincode')
	.catch((err) => {
		logger.error('Failed to install chaincode with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


function installChaincodeByOrg(org, params) {
	logger.info('Calling peers in organization "%s" to install chaincode', org);

	// Different org uses different client
	var client = new hfc();
	var channel = util.getChannel(params);
	var ORGS = util.getNetwork(params);
	var chain = setup.setupChainByOrg(client, channel, ORGS, org, null, false);//TODO:, eventhubs, true

	return Submitter.getSubmitter(client, ORGS, org, logger)
	.then((admin) => {	
		logger.info('Successfully enrolled user \'admin\'');
		chain.initialize();
		return sendInstallProposal(client, chain, admin, params);

	}).then((results) => {
		var response = {
				status : 'failed'
		};
		if (util.checkProposalResponses(null, results, 'Install chaincode', logger)) {
			response.status = 'success';
		}
		return response;

	}).catch((err) => {
		logger.error('Failed to install chaincode with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
	
}


function sendInstallProposal(client, chain, admin, params) {
	var nonce = ClientUtils.getNonce()
	var tx_id = hfc.buildTransactionID(nonce, admin);
	var targets = chain.getPeers();

	var request = {
		targets: targets,
		chaincodePath: util.getChaincodePath(params),
		chaincodeId: util.getChaincodeId(params),
		chaincodeVersion: util.getChaincodeVersion(params),
		txId: tx_id,
		nonce: nonce
	};

	return client.installChaincode(request);	
}

