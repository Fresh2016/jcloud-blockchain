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
var Listener = require('./listen-event.js');
var exe = require('./execute-recursively.js');
var setup = require('./setup.js');
var util = require('./util.js');
var Policy = require('./endorsement-policy.js');

ClientUtils.setConfigSetting('request-timeout', 300000);
var logger = ClientUtils.getLogger('invoke-chaincode');

var targets = [];

//Invoke transactions just use org1's identity to
//submit the request. intentionally we are using a different org
//than the one that submitted the "move" transaction, although either org
//should work properly
var defaultOrg = 'org1';

module.exports.instantiateChaincode = instantiateChaincode;
module.exports.invokeChaincode = invokeChaincode;
module.exports.upgradeChaincode = upgradeChaincode;


function commitTransaction(chain, endorsement, eventhubs, tx_id) {
	// Set the transaction listener and set a timeout of 30sec
	// if the transaction did not get committed within the timeout period,
	// fail the test
	var request = generateCommitRequest(endorsement);
	var deployId = tx_id.toString();

	var eventPromises = [];
	// Use .some instead of .forEach, avoiding duplicate listeners with same tx id
	//eventhubs.forEach((eh) => {
	eventhubs.some((eh) => {
		return Listener.addPromise(eventPromises, 'tx', eh, deployId, null);
	});	

	var sendPromise = chain.sendTransaction(request);
	return Promise.all([sendPromise].concat(eventPromises))
	.then((results) => {
		return processCommitResponse(results, tx_id);
	}).then((results) => {
		Listener.disconnectEventhub(eventhubs);
		return results;
	}).catch((err) => {
		// Assure Eventhub will be disconnected when expired
		Listener.disconnectEventhub(eventhubs);
		util.throwError(logger, err, 'Failed to commit and get notifications within the timeout period.');
	});
}


function finishCommit(response, logger, tx_id) {
	if (response.status === 'SUCCESS') {
		printSuccessHint(tx_id);
		var result = {
				status : 'success',
				message : {
					TransactionId : tx_id
				},
				id : '2'
			};
		return result;			
	} else {
		util.throwError(logger, response.status, 'Failed to order the transaction. Error code: ');
	}
}


function generateCommitRequest(endorsement) {
	var proposalResponses = endorsement[0];
	var proposal = endorsement[1];
	var header   = endorsement[2];
	logger.debug('Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s', 
			proposalResponses[0].response.status, proposalResponses[0].response.message, proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature);

	var request = {
		proposalResponses: proposalResponses,
		proposal: proposal,
		header: header
	};
	logger.debug('Commit request is %s ', JSON.stringify(request));

	return request;
}


function generateProposalRequest(params, nonce, tx_id) {
	var request = {
			chainId : util.getChannel(params),
			chaincodeId : util.getChaincodeId(params),
			chaincodeVersion : util.getChaincodeVersion(params),
			fcn : util.getFunctionName(params),
			args : util.getFunctionArgs(params),
			txId : tx_id,
			nonce : nonce,
			
			// Added in v1.0. 
			// TODO: should be programmable.
			'endorsement-policy': Policy.getPolicy(params, 'ONE_OF_TWO_ORG_MEMBER')
	};

	if ('init' == request.fcn) {
		request.chaincodePath = util.getChaincodePath(params);
	}
	
	return request;
}


/*
//for instantiate chaincode org by org, but now we do it in one instantiation
function instantiateChaincode(params) {
	logger.info('\n\n***** Hyperledger fabric client: instantiate chaincode *****');
	
	var orgs = util.getOrgs(ORGS);
	logger.info('There are %s organizations: %s. Going to instantiate chaincode one by one.', orgs.length, orgs);

	return exe.executeTheNext(orgs, instantiateChaincodeByOrg, params, 'Instantiate Chaincode')
	.catch((err) => {
		logger.error('Failed to instantiate chaincode with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};
*/


function instantiateChaincode(rpctime, params) {
	logger.info('\n\n***** Hyperledger fabric client: instantiate chaincode *****');

	// Client and chain should be claimed here
	var client = new hfc();
	var eventhubs = [];
	var tx_id = { value : null };

	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = defaultOrg;
	var enrolled_admin = null;
	var channel = util.getChannel(params);
	var ORGS = util.getNetwork(params);

	var chain = setup.setupChainWithAllPeers(client, channel, ORGS, eventhubs);
	
	return Submitter.getSubmitter(client, ORGS, org, logger)
	.then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		enrolled_admin = admin;
		return chain.initialize();

	}).then((nothing) => {
		logger.info('Successfully initialized chain');
		return sendInstantiateProposal(chain, enrolled_admin, params, false, tx_id);

	}).then((results) => {
		if (util.checkProposalResponses(chain, results, 'Instantiate transaction', logger)) {
			return commitTransaction(chain, results, eventhubs, tx_id.value);
		} else {
			util.throwError(logger, null, 'Bad proposal responses. ');
		}
	}).catch((err) => {
		logger.error('Failed to instantiate chaincode with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


function invokeChaincode(rpctime, params) {
	logger.info('\n\n***** Hyperledger fabric client: invoke chaincode *****');

	// client and chain should be claimed here
	var client = new hfc();
	var chain = null;

	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = defaultOrg;
	var tx_id = { value : null };
	var eventhubs = [];
	var enrolled_admin = null;
	var channel = util.getChannel(params);
	var ORGS = util.getNetwork(params);
	
	return setup.getAlivePeer(ORGS, org)
	.then((peerInfo) => {
		logger.debug('Successfully get alive peer %s', JSON.stringify(peerInfo));
		return setup.setupChainWithPeer(client, channel, ORGS, peerInfo, true, eventhubs, true);

	}).then((readyChain) => {
		logger.debug('Successfully setup chain %s', readyChain.getName());
		chain = readyChain;
		return Submitter.getSubmitter(client, ORGS, org, logger);

	}).then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		enrolled_admin = admin;
		return chain.initialize();

	}).then((nothing) => {
		logger.info('Successfully initialized chain');
		return sendTransactionProposal(chain, enrolled_admin, params, tx_id);

	}).then((results) => {
		if (util.checkProposalResponses(chain, results, 'Invoke transaction', logger)) {
			return commitTransaction(chain, results, eventhubs, tx_id.value);
		} else {
			util.throwError(logger, null, 'Bad proposal responses. ');
		}
		
	}).catch((err) => {
		logger.error('Failed to invoke transaction with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};


function printSuccessHint(tx_id) {
	logger.info('Successfully committed transaction to the orderer.');
	logger.info('******************************************************************');
	logger.info('To manually run query.js, set the following environment variables:');
	logger.info('E2E_TX_ID='+'\''+tx_id+'\'');
	logger.info('******************************************************************');
}


function processCommitResponse(responses, tx_id) {
	logger.debug('Successfully get transaction commit response: %s', JSON.stringify(responses));
	
	try {
		// First returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
		let response = responses[0];
		
		if(response) {
			// Sending transactionId back to routes.js
			logger.info('Invoke transaction event promise all complete.');
			return finishCommit(response, logger, tx_id);
		}
		
	} catch(err) {
		util.throwError(logger, err, 'Failed to process commit response. ');
	}
}


function sendInstantiateProposal(chain, admin, params, isUpgrade, tx_id) {
	var nonce = ClientUtils.getNonce();
	tx_id.value = hfc.buildTransactionID(nonce, admin);
	params.ctorMsg = {
			functionName : 'init'
	};

	var request = generateProposalRequest(params, nonce, tx_id.value);
	logger.debug('Sending instantiate proposal "%s"', JSON.stringify(request));

	if(!isUpgrade) {
		return chain.sendInstantiateProposal(request);
	}
	else {
		return chain.sendUpgradeProposal(request);
	}
}


function sendTransactionProposal(chain, admin, params, tx_id) {
	var nonce = ClientUtils.getNonce();
	tx_id.value = hfc.buildTransactionID(nonce, admin);

	var request = generateProposalRequest(params, nonce, tx_id.value);
	logger.debug('Sending invoke transaction proposal "%s"', JSON.stringify(request));

	return chain.sendTransactionProposal(request);
}


function upgradeChaincode(rpctime, params) {
	logger.info('\n\n***** Hyperledger fabric client: upgrade chaincode *****');

	// Client and chain should be claimed here
	var client = new hfc();
	var eventhubs = [];
	var tx_id = { value : null };

	// this is a transaction, will just use org1's identity to
	// submit the request
	var org = defaultOrg;
	var enrolled_admin = null;
	var channel = util.getChannel(params);
	var ORGS = util.getNetwork(params);

	var chain = setup.setupChainWithAllPeers(client, channel, ORGS, eventhubs);

	return Submitter.getSubmitter(client, ORGS, org, logger)
	.then((admin) => {
		logger.info('Successfully enrolled user \'admin\'');
		enrolled_admin = admin;
		return chain.initialize();

	}).then((nothing) => {
		logger.info('Successfully initialized chain');
		return sendInstantiateProposal(chain, enrolled_admin, params, true, tx_id);

	}).then((results) => {
		if (util.checkProposalResponses(chain, results, 'Upgrade transaction', logger)) {
			return commitTransaction(chain, results, eventhubs, tx_id.value);
		} else {
			util.throwError(logger, null, 'Bad proposal responses. ');
		}
	}).catch((err) => {
		logger.error('Failed to upgrade chaincode with error:  %s', err);
		// Failure back and accept further err processing
		return new Promise((resolve, reject) => reject(err));
	});
};