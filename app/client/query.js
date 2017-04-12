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
var targets = [];

// Used by decodeTransaction
var commonProtoPath = './node_modules/fabric-client/lib/protos/common/common.proto';
var transProtoPath = './node_modules/fabric-client/lib/protos/peer/transaction.proto';


// Query transactions just use org2's identity to
// submit the request. intentionally we are using a different org
// than the one that submitted the "move" transaction, although either org
// should work properly
var defaultOrg = 'org2';


module.exports.isTransactionSucceed = isTransactionSucceed;
module.exports.queryConfig = queryConfig;
module.exports.queryPeers = queryPeers;
module.exports.queryOrderers = queryOrderers;
module.exports.queryTransaction = queryTransaction;
module.exports.queryTransactionHistory = queryTransactionHistory;


function addPeerPromise(peerPromises, chain, thisPeer) {
	var peerPromise = new Promise((resolve, reject) => {
		resolve(chain.queryChannels(thisPeer));
	}).then((response) => {
		response.peer = thisPeer.getUrl();
		return response;
	});	
	peerPromises.push(peerPromise);
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
		if (transactionId === channel_header.tx_id && 0 === processed_transaction.validationCode) {
			return true;
		} else {
			return false;
		}
	} catch(err) {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to decode transaction query response.');
		return false;
	}
}


function getPeerStatus(response, channelName){
	var peerStatus = {
			name: response.peer,
			status: 'DOWN'
		}
	if (isPeerInChannel(response, channelName)){
		peerStatus.status = 'UP';
	}
	return peerStatus;
}


function isPeerInChannel(response, channelName) {
	if (null != response.channels) {
		for (let num in response.channels) {
			if (channelName === response.channels[num].channel_id) {
				logger.debug('Peer %s has joined channel %s', response.peer, 
						response.channels[num].channel_id);
				return true;
			}
		}
	}
	return false;
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
	// Only when peer responses with channels including desired channelName,
	// its status is returned as UP. Other cases are DOWN.
	var result = [];
	if (responses) {
		for (let i in responses) {
			let response = responses[i];
			if (null != response) {
				var peerStatus = getPeerStatus(response, channelName);
			}
			result.push(peerStatus);
		}
	}
	return result;
}


function isTransactionSucceed(transactionId) {
	logger.info('\n\n***** Hyperledger fabric client: query transaction validationCode by transactionId: %s *****', transactionId);

	// client and chain should be claimed here
	var client = new hfc();
	var chain = null;

	// this is a query, will just use org2's identity to
	// submit the request
	var org = defaultOrg;
	var options = { 
			path: util.storePathForOrg(util.getOrgNameByOrg(ORGS, org)) 
		};	
	
	return setup.getAlivePeer(ORGS, org)
	.then((peerInfo) => {
		logger.debug('Successfully get alive peer %s', JSON.stringify(peerInfo));
		return setup.setupChainWithPeer(client, ORGS, peerInfo, true, null, false);

	}).then((readyChain) => {
		logger.debug('Successfully setup chain %s', readyChain.getName());
		chain = readyChain;
		return hfc.newDefaultKeyValueStore(options);
		
	}).then((keyValueStore) => {
		client.setStateStore(keyValueStore);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {		
		logger.debug('Successfully enrolled user \'admin\'');

		//FIXME: temporary fix until mspid is configured into Chain
		admin.mspImpl._id = util.getMspid(ORGS, org);

		// use default primary peer
		return queryTransactionByTxId(chain, transactionId);
		
	}).then((processed_transaction) => {
		var response = {
				status : 'failed'
		};
		var succeeded_decode = decodeTransaction(transactionId, processed_transaction, commonProtoPath, transProtoPath);
		if (succeeded_decode) {		
			logger.info('END of query transaction status.');
			response.status = 'success';
			return new Promise((resolve, reject) => resolve(response));
		} else {
			util.throwError(logger, null, 'Failed to query with invalid tx_id.');
		}
		
	}).catch((err) => {
		logger.error('Failed to query with error:' + err.stack ? err.stack : err);
		return new Promise((resolve, reject) => reject(err));
		
	});
}


//function queryConfig(channelName, callback) {
function queryConfig(channelName) {
// TODO: channel name is fixed from config file and should be passed from REST request
	// TODO: care only 1 orderer. should be order cluster status when we have
	logger.info('\n\n***** Hyperledger fabric client: query configuration of channel: %s *****', channelName);

	// client and chain should be claimed here
	var client = new hfc();
	var chain = null;

	// this is a query, will just use org2's identity to
	// submit the request
	var org = defaultOrg;
	var ordererStatus = {
			name: '',
			status: 'DOWN'
		}
	
	return setup.getAlivePeer(ORGS, org)
	.then((peerInfo) => {
		logger.debug('Successfully get alive peer %s', JSON.stringify(peerInfo));
		//TODO: maybe it's not needed to add any peer, to be tested
		return setup.setupChainWithPeer(client, ORGS, peerInfo, true, null, false);

	}).then((readyChain) => {
		logger.debug('Successfully setup chain %s', readyChain.getName());
		chain = readyChain;
		ordererStatus.name = chain.getOrderers()[0].getUrl();
		var options = { 
			path: util.storePathForOrg(util.getOrgNameByOrg(ORGS, org)) 
		};
		return hfc.newDefaultKeyValueStore(options);
		
	}).then((keyValueStore) => {
		client.setStateStore(keyValueStore);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {		
		logger.debug('Successfully enrolled user \'admin\'');

		//FIXME: temporary fix until mspid is configured into Chain
		admin.mspImpl._id = util.getMspid(ORGS, org);
		return chain.getChannelConfig();
		
	}).then((response_payloads) => {
		logger.info('Got config envelope from getChannelConfig.');
		parseQueryChainConfig(response_payloads);
		ordererStatus.status = 'UP';
		logger.info('END of query config(orderer).');
		return new Promise((resolve, reject) => resolve(ordererStatus));

	}).catch((err) => {
		logger.error('Failed to query with error:' + err.stack ? err.stack : err);
		logger.info('END of query config(orderer).');
		return new Promise((resolve, reject) => reject(err));

	});
}


function queryOrderers(channelName) {
	// TODO: channel name is fixed from config file and should be passed from REST request
	logger.info('\n\n***** Hyperledger fabric client: query orderer status of channel: %s *****', channelName);
	return module.exports.queryConfig(channelName);
}


//function queryOrderers(channelName, callback) {
//	// TODO: channel name is fixed from config file and should be passed from REST request
//	logger.info('\n\n***** Hyperledger fabric client: query orderer status of channel: %s *****', channelName);
//	
//	return module.exports.queryConfig(channelName, callback);
//}


//function queryPeers(channelName, callback) {
function queryPeers(channelName) {
	// TODO: channel name is fixed from config file and should be passed from REST request
	logger.info('\n\n***** Hyperledger fabric client: query peer status of channel: %s *****', channelName);

	// client and chain should be claimed here
	var client = new hfc();
	var eventhubs = [];
	var chain = setup.setupChainWithAllPeers(client, ORGS, eventhubs);

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
		logger.debug('Successfully enrolled user \'admin\'');

		//FIXME: temporary fix until mspid is configured into Chain
		admin.mspImpl._id = util.getMspid(ORGS, org);

		var peerPromises = [];
		var peers = chain.getPeers();
		peers.forEach((thisPeer) => {
			return addPeerPromise(peerPromises, chain, thisPeer)
		});	
		return Promise.all(peerPromises)
			.then((responses) => {
				result = parseQueryPeerStatusReponse(responses, channelName);
				logger.debug('Returning peer status: %s', JSON.stringify(result));
				logger.info('END of query peers.');
				return new Promise((resolve, reject) => resolve(responses));

			}).catch((err) => {
				logger.error('Failed to send query or parse query response due to error: ' + err.stack ? err.stack : err);
				logger.info('END of query peers.');
				return new Promise((resolve, reject) => reject(err));

			});
	});
}


function queryTransaction() {
	logger.info('\n\n***** Hyperledger fabric client: query transaction *****');

	// client and chain should be claimed here
	var client = new hfc();
	var chain = null;

	// this is a query, will just use org2's identity to
	// submit the request
	var org = defaultOrg;
	var options = { 
			path: util.storePathForOrg(util.getOrgNameByOrg(ORGS, org)) 
		};

	
	var block_result = {};
	var the_user = null;
	
	return setup.getAlivePeer(ORGS, org)
	.then((peerInfo) => {
		logger.debug('Successfully get alive peer %s', JSON.stringify(peerInfo));
		return setup.setupChainWithPeer(client, ORGS, peerInfo, true, null, false);

	}).then((readyChain) => {
		logger.debug('Successfully setup chain %s', readyChain.getName());
		chain = readyChain;
		return hfc.newDefaultKeyValueStore(options);
		
	}).then((keyValueStore) => {
		client.setStateStore(keyValueStore);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {	
		logger.debug('Successfully enrolled user \'admin\'');
		the_user = admin;

		//FIXME: temporary fix until mspid is configured into Chain
		admin.mspImpl._id = util.getMspid(ORGS, org);
		
		// use default primary peer
		return chain.queryInfo();
		
	}).then((blockchainInfo) => {
		logger.debug('Chain queryInfo() returned block height = ' + blockchainInfo.height.low);
		logger.debug('Chain queryInfo() returned block previousBlockHash = ' + blockchainInfo.previousBlockHash);
		logger.debug('Chain queryInfo() returned block currentBlockHash = ' + blockchainInfo.currentBlockHash);
		var block_hash = blockchainInfo.currentBlockHash;
		block_result.blockNumber = blockchainInfo.height.low;
		block_result.previousBlockHash = blockchainInfo.previousBlockHash;
		block_result.currentBlockHash = blockchainInfo.currentBlockHash;

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
		
	}).then((response_payloads) => {
		logger.debug('Chain queryByChaincode() returned response_payloads: ' + response_payloads);
		var response = Object.assign(parseQuerySupplyChainResponse(response_payloads), block_result);
		response.status = 'success';
		logger.info('END of query transaction.');
		return new Promise((resolve, reject) => resolve(response));

	}).catch((err) => {
		logger.error('Failed to send query or parse query response due to error: ' + err.stack ? err.stack : err);
		logger.info('END of query transaction.');
		return new Promise((resolve, reject) => reject(err));
		
	});
}


function queryTransactionHistory() {
	logger.info('\n\n***** Hyperledger fabric client: query transaction history *****');

	// client and chain should be claimed here
	var client = new hfc();
	var chain = null;

	// this is a query, will just use org2's identity to
	// submit the request
	var org = defaultOrg;
	var options = { 
			path: util.storePathForOrg(util.getOrgNameByOrg(ORGS, org)) 
		};
	var the_user = null;

	return setup.getAlivePeer(ORGS, org)
	.then((peerInfo) => {
		logger.debug('Successfully get alive peer %s', JSON.stringify(peerInfo));
		return setup.setupChainWithPeer(client, ORGS, peerInfo, true, null, false);

	}).then((readyChain) => {
		logger.debug('Successfully setup chain %s', readyChain.getName());
		chain = readyChain;
		return hfc.newDefaultKeyValueStore(options);
		
	}).then((keyValueStore) => {
		client.setStateStore(keyValueStore);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {		
		logger.debug('Successfully enrolled user \'admin\'');
		the_user = admin;

		//FIXME: temporary fix until mspid is configured into Chain
		admin.mspImpl._id = util.getMspid(ORGS, org);
		
		// use default primary peer
		return chain.queryInfo();
		
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
	}).then((response_payloads) => {
		logger.debug('Chain queryByChaincode() returned response_payloads: ' + response_payloads);
		var response = parseQueryHistoryResponse(response_payloads);
		response.status = 'success';
		logger.info('END of query transaction history.');
		return new Promise((resolve, reject) => resolve(response));
		
	}).catch((err) => {
		logger.error('Failed to send query or parse query response due to error: ' + err.stack ? err.stack : err);
		logger.info('END of query transaction history.');
		return new Promise((resolve, reject) => reject(err));
	});
}


function queryTransactionByTxId(chain, transactionId){
	//TODO: a default id is set for initial value during loading query page
	if (!transactionId) {
		util.throwError(logger, new Error('Transaction ID not found'), '');
	} else {
		logger.info('Got transactionId %s', transactionId);
		// send query
		return chain.queryTransaction(transactionId); //assumes the end-to-end has run first
	}
}