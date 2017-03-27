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

var async = require('async');

var hfc = require('fabric-client');
var ClientUtils = require('fabric-client/lib/utils.js');
var Peer = require('fabric-client/lib/Peer.js');
var Orderer = require('fabric-client/lib/Orderer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var Submitter = require('./get-submitter.js');
var setup = require('./setup.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('query-chaincode');
var ORGS = util.ORGS;

var nonce = null;
var the_user = null;
var targets = [];

// Used by decodeTransaction
var commonProtoPath = './node_modules/fabric-client/lib/protos/common/common.proto';
var transProtoPath = './node_modules/fabric-client/lib/protos/peer/transaction.proto';


// Default response is all empty
var result = {
		blockNumber : '',
		sku : '',
		tradeDate : '',
		traceInfo : '',
		previousBlockHash : '',
		currentBlockHash : '',
		transactionId : '',
		counter : ''
	};

// Query transactions just use org2's identity to
// submit the request. intentionally we are using a different org
// than the one that submitted the "move" transaction, although either org
// should work properly
var defaultOrg = 'org2';

module.exports.isTransactionSucceed = function(transactionId, callback) {
	logger.info('\n\n***** Hyperledger fabric client: query transaction validationCode by transactionId: %s *****', transactionId);

	// Different org uses different client
	var client = new hfc();
	var org = defaultOrg;
	var orgName = util.getOrgNameByOrg(ORGS, org);
	var chain = setup.setupChainWithOnlyPrimaryPeer(client, ORGS, orgName, org);
	
	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
		
	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		the_user = admin;
		the_user.mspImpl._id = util.getMspid(ORGS, org);

		// use default primary peer
		return queryTransactionByTxId(transactionId);
		
	}).then((processed_transaction) => {
		try {
			callback(decodeTransaction(transactionId, processed_transaction, commonProtoPath, transProtoPath));
			logger.info('END of query transaction status.');
		} catch(err) {
			callback(err);
		}

	}).catch((err) => {
		logger.error('Failed to query with error:' + err.stack ? err.stack : err);
		callback(err);
	});
}


module.exports.queryTransaction = function(transactionId, callback) {
	logger.info('\n\n***** Hyperledger fabric client: query transaction by transactionId: %s *****', transactionId);
	
	// Different org uses different client
	var client = new hfc();
	var org = defaultOrg;
	var orgName = util.getOrgNameByOrg(ORGS, org);
	var chain = setup.setupChainWithOnlyPrimaryPeer(client, ORGS, orgName, org);
	
	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
		
	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		the_user = admin;
		the_user.mspImpl._id = util.getMspid(ORGS, org);
		
		// use default primary peer
		return chain.queryInfo();
		
	}).then((blockchainInfo) => {
		logger.debug('Chain queryInfo() returned block height = ' + blockchainInfo.height.low);
		logger.debug('Chain queryInfo() returned block previousBlockHash = ' + blockchainInfo.previousBlockHash);
		logger.debug('Chain queryInfo() returned block currentBlockHash = ' + blockchainInfo.currentBlockHash);
		var block_hash = blockchainInfo.currentBlockHash;
		result.blockNumber = blockchainInfo.height.low;
		result.previousBlockHash = blockchainInfo.previousBlockHash;
		result.currentBlockHash = blockchainInfo.currentBlockHash;

	}).then(() => {
		nonce = ClientUtils.getNonce()
		var tx_id = chain.buildTransactionID(nonce, the_user);

		// send query
		// for supplychain
		var request = {
			chaincodeId : util.chaincodeId,
			chaincodeVersion : util.chaincodeVersion,
			chainId: util.channel,
			txId: tx_id,
			nonce: nonce,
			fcn: 'queryTrade',
			args: ["Sku", "TradeDate", "TraceInfo"]
		};
		logger.debug('Sending query request: %s', JSON.stringify(request));
		
		return chain.queryByChaincode(request);
	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to send query chaincode due to error: ');
		return result;
		
	}).then((response_payloads) => {
		logger.debug('Chain queryByChaincode() returned response_payloads: ' + response_payloads);
		callback(parseQuerySupplyChainResponse(response_payloads));
		logger.info('END of query transaction.');

	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to parse query response due to error: ');
		callback(err);
	}).catch((err) => {
		logger.error('Failed to query with error:' + err.stack ? err.stack : err);
		callback(err);
	});
}


module.exports.queryTransactionHistory = function(transactionId, callback) {
	logger.info('\n\n***** Hyperledger fabric client: query transaction history by transactionId: %s *****', transactionId);
	
	// Different org uses different client
	var client = new hfc();
	var org = defaultOrg;
	var orgName = util.getOrgNameByOrg(ORGS, org);
	var chain = setup.setupChainWithOnlyPrimaryPeer(client, ORGS, orgName, org);
	
	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
		
	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		the_user = admin;
		the_user.mspImpl._id = util.getMspid(ORGS, org);
		
		// use default primary peer
		return chain.queryInfo();
		
	}).then((blockchainInfo) => {
		logger.debug('Chain queryInfo() returned block height = ' + blockchainInfo.height.low);
		logger.debug('Chain queryInfo() returned block previousBlockHash = ' + blockchainInfo.previousBlockHash);
		logger.debug('Chain queryInfo() returned block currentBlockHash = ' + blockchainInfo.currentBlockHash);
		var block_hash = blockchainInfo.currentBlockHash;
		result.blockNumber = blockchainInfo.height.low;
		result.previousBlockHash = blockchainInfo.previousBlockHash;
		result.currentBlockHash = blockchainInfo.currentBlockHash;

	}).then(() => {
		nonce = ClientUtils.getNonce()
		var tx_id = chain.buildTransactionID(nonce, the_user);

		// send query
		// for supplychain
		var request = {
			chaincodeId : util.chaincodeId,
			chaincodeVersion : util.chaincodeVersion,
			chainId: util.channel,
			txId: tx_id,
			nonce: nonce,
			fcn: 'getTradeHistory',
			args: ["TransactionId", "TraceInfo"]
		};
		logger.debug('Sending query request: %s', JSON.stringify(request));
		
		return chain.queryByChaincode(request);
	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to send query chaincode due to error: ');
		return result;
		
	}).then((response_payloads) => {
		logger.debug('Chain queryByChaincode() returned response_payloads: ' + response_payloads);
		callback(parseQueryHistoryResponse(response_payloads));
		logger.info('END of query transaction hitory.');

	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to parse query response due to error: ');
		callback(err);
	}).catch((err) => {
		logger.error('Failed to query with error:' + err.stack ? err.stack : err);
		callback(err);
	});
}


module.exports.queryPeers = function(channelName, callback) {
	// TODO: channel name is fixed from config file and should be passed from REST request
	logger.info('\n\n***** Hyperledger fabric client: query peer status of channel: %s *****', channelName);

	// Different org uses different client
	var client = new hfc();
	var org = defaultOrg;
	var orgName = util.getOrgNameByOrg(ORGS, org);
	var chain = setup.setupChainWithAllPeers(client, ORGS, orgName);
	
	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);
		
	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		the_user = admin;
		the_user.mspImpl._id = util.getMspid(ORGS, org);
		
		var peers = chain.getPeers();
		async.mapSeries(peers, function(thisPeer, processResults) {
			chain.queryChannels(thisPeer)
			.then((response) => {
				response.peer = thisPeer.getUrl();
				processResults(null, response);
			}, (err) => {
				processResults(err, null);
			}).catch((err) => {
				logger.error('Failed due to unexpected reasons. ' + err.stack ? err.stack : err);
				processResults(err, null);
			});

		}, function(err, responses) {
			logger.debug('processResults get callback with results %s and err %s.', 
					JSON.stringify(responses), JSON.stringify(err));
			var result = parseQueryPeerStatusReponse(responses, channelName);
			logger.debug('Returning peer status: %s', JSON.stringify(result));
			callback(result);
			logger.info('END of query peers.');
		},
		(err) => {
			util.throwError(logger, err.stack ? err.stack : err, 'Failed to parse query response due to error: ');
			callback(err);
		});			
	}).catch((err) => {
		logger.error.error('Failed to query with error:' + err.stack ? err.stack : err);
		callback(err);
	});
}


module.exports.queryOrderers = function(channelName, callback) {
	// TODO: channel name is fixed from config file and should be passed from REST request
	logger.info('\n\n***** Hyperledger fabric client: query orderer status of channel: %s *****', channelName);
	
	return module.exports.queryConfig(channelName, callback);
}


module.exports.queryConfig = function(channelName, callback) {
	// TODO: channel name is fixed from config file and should be passed from REST request
	// TODO: care only 1 orderer. should be order cluster status when we have
	logger.info('\n\n***** Hyperledger fabric client: query configuration of channel: %s *****', channelName);

	// Different org uses different client
	var client = new hfc();
	var org = defaultOrg;
	var orgName = util.getOrgNameByOrg(ORGS, org);
	var chain = setup.setupChain(client, ORGS, orgName);
	var ordererStatus = {
			name: chain.getOrderers()[0].getUrl(),
			status: 'DOWN'
		}
	
	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);
		
	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		the_user = admin;
		the_user.mspImpl._id = util.getMspid(ORGS, org);
		return chain.getChannelConfig();
		
	}).then((response_payloads) => {
		logger.info('Got config envelope from getChannelConfig.');
		try {
			parseQueryChainConfig(response_payloads);
			ordererStatus.status = 'UP';
			callback(ordererStatus);
		} catch(err) {
			callback(ordererStatus);
		}
			
	}).catch((err) => {
		logger.error.error('Failed to query with error:' + err.stack ? err.stack : err);
		callback(ordererStatus);
	});
}


function decodeTransaction(transactionId, processed_transaction, commonProtoPath, transProtoPath) {
	// set to be able to decode grpc objects
	var grpc = require('grpc');
	var commonProto = grpc.load(commonProtoPath).common;
	var transProto = grpc.load(transProtoPath).protos;

	try {
		var payload = commonProto.Payload.decode(processed_transaction.transactionEnvelope.payload);
		var channel_header = commonProto.ChannelHeader.decode(payload.header.channel_header);
		logger.debug('Chain queryTransaction - transaction ID :: %s', channel_header.tx_id);
		logger.debug('Chain queryTransaction - tranaction validationCode:: %s ', processed_transaction.validationCode);
	} catch(err) {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to decode transaction query response.');
	}
	
	if (transactionId == channel_header.tx_id && 0 == processed_transaction.validationCode) {
		return true;
	} else {
		return false;
	}
}


function parseQueryChainConfig(config_envelope) {
	try {
		let channel = config_envelope.config.channel;
		logger.debug('queryConfig -  Channel version :: %s', channel.version);
		logger.debug('queryConfig -  Channel groups name and originalName:: %s, ', 
				channel.groups.field.name, channel.groups.field.originalName);

		let app_map = channel.groups.map.Application;
		let org1Msp_map = app_map.value.groups.map.Org1MSP;
		logger.debug('queryConfig -  Channel groups maps of %s-%s', 
				app_map.key, org1Msp_map.key);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				org1Msp_map.value.policies.map.Admins.key, 
				org1Msp_map.value.policies.map.Admins.value.mod_policy);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				org1Msp_map.value.policies.map.Readers.key, 
				org1Msp_map.value.policies.map.Readers.value.mod_policy);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				org1Msp_map.value.policies.map.Writers.key, 
				org1Msp_map.value.policies.map.Writers.value.mod_policy);

		let org2Msp_map = app_map.value.groups.map.Org2MSP;
		logger.debug('queryConfig -  Channel groups maps of %s-%s', 
				app_map.key, org2Msp_map.key);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				org1Msp_map.value.policies.map.Admins.key, 
				org1Msp_map.value.policies.map.Admins.value.mod_policy);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				org1Msp_map.value.policies.map.Readers.key, 
				org1Msp_map.value.policies.map.Readers.value.mod_policy);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				org1Msp_map.value.policies.map.Writers.key, 
				org1Msp_map.value.policies.map.Writers.value.mod_policy);

		let orderer_map = channel.groups.map.Orderer;
		let ordererMSP_map = orderer_map.value.groups.map.OrdererMSP;
		logger.debug('queryConfig -  Channel groups maps of %s-%s', 
				orderer_map.key, ordererMSP_map.key);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				ordererMSP_map.value.policies.map.Admins.key, 
				ordererMSP_map.value.policies.map.Admins.value.mod_policy);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				ordererMSP_map.value.policies.map.Readers.key, 
				ordererMSP_map.value.policies.map.Readers.value.mod_policy);
		logger.debug('queryConfig -  Channel groups maps:: (%s, %s)', 
				ordererMSP_map.value.policies.map.Writers.key, 
				ordererMSP_map.value.policies.map.Writers.value.mod_policy);

		logger.debug('queryConfig -  Channel policies name and originalName:: %s, %s', 
				channel.policies.field.name, channel.policies.field.originalName);

		let policy_map = channel.policies.map;
		logger.debug('queryConfig -  Channel policies maps:: (%s, %s)', 
				policy_map.AcceptAllPolicy.key, policy_map.AcceptAllPolicy.value.mod_policy);
		logger.debug('queryConfig -  Channel policies maps:: (%s, %s)', 
				policy_map.Admins.key, policy_map.Admins.value.mod_policy);
		logger.debug('queryConfig -  Channel policies maps:: (%s, %s)', 
				policy_map.Readers.key, policy_map.Readers.value.mod_policy);
		logger.debug('queryConfig -  Channel policies maps:: (%s, %s)', 
				policy_map.Writers.key, policy_map.Writers.value.mod_policy);
		
		return true;
		
		} catch(err) {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to parse query chain config response.');
		return false;
	}
}


function parseQuerySupplyChainResponse(response_payloads) {
	if (response_payloads) {
		for(let i = 0; i < response_payloads.length; i++) {
			logger.debug('Query results [' + i + ']: ' + response_payloads[i]);
			var res_list = response_payloads[i].toString('utf8').split(',');
			result.sku = res_list[0];
			result.tradeDate = res_list[1];
			result.traceInfo = res_list[2];
			result.counter = res_list[3];
			return result;
		}
		//return result;
	} else {
		logger.error('response_payloads is null');
		return result;
	}
}


function parseQueryHistoryResponse(response_payloads) {
	var result = [];
	if (response_payloads) {
		for(let i = 0; i < response_payloads.length; i++) {
			logger.debug('Query results [' + i + ']: ' + response_payloads[i]);
			var res_list = response_payloads[i].toString('utf8')
								.replace('[', '').replace(']', '')
								.replace(/\},{/g, '};{').split(';');
			for (let i in res_list) {
				result.push(JSON.parse(res_list[i]));
			}
			logger.debug('Parsed result: %s', JSON.stringify(result));
			return result;
		}
	} else {
		logger.error('response_payloads is null');
		return result;
	}
}


function parseQueryPeerStatusReponse(responses, channelName) {
	var result = [];
	for (let i in responses) {
		let response = responses[i];
		var peerStatus = {
				name: response.peer,
				status: 'DOWN'
			}
		if (null != response && null != response.channels) {
			for (let num in response.channels) {
				if (channelName == response.channels[num].channel_id) {
					peerStatus.status = 'UP';
					logger.debug('Peer %s has joined channel %s', response.peer, 
							response.channels[num].channel_id);
					break;
				}
			}
		}
		result.push(peerStatus);
	}
	return result;
}


function queryTransactionByTxId(transactionId){
	//TODO: a default id is set for initial value during loading query page
	if (!transactionId) {
		logger.info('Transaction ID not found.');
		transactionId = 'ebaee52e1994d93232b94322557f9348777f9d8b74c91398f8fcc896aa212b88';
		//throw new Error('Transaction ID not found');
	}
	logger.info('Got transactionId %s', transactionId);
	// send query
	return chain.queryTransaction(transactionId); //assumes the end-to-end has run first
}