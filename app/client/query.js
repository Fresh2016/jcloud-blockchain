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

//TODO: to be removed
//var tx_id = null;
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

// this is a transaction, will just use org2's identity to
// submit the request. intentionally we are using a different org
// than the one that submitted the "move" transaction, although either org
// should work properly
var defaultOrg = 'org2';

module.exports.isTransactionSucceed = function(transactionId) {
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
		return decodeTransaction(transactionId, processed_transaction, commonProtoPath, transProtoPath);

	}).catch((err) => {
		logger.error('Failed to query with error:' + err.stack ? err.stack : err);
		return result;
	});
}


module.exports.queryTransaction = function(transactionId) {
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
		return parseQuerySupplyChainResponse(response_payloads);

	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to parse query response due to error: ');

	}).catch((err) => {
		logger.error('Failed to query with error:' + err.stack ? err.stack : err);
		return result;
	});
}


module.exports.queryPeers = function(channelName) {
	// TODO: channel name is fixed from config file and should be passed from REST request
	logger.info('\n\n***** Hyperledger fabric client: query peer list of channel: %s *****', channelName);

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
		var result = [];
		
		the_user = admin;
		the_user.mspImpl._id = util.getMspid(ORGS, org);
		
		let peers = chain.getPeers();
		for (let i = 0; i < peers.length; i++)  {
			thisPeer = peers[i];
			console.log(thisPeer.getUrl());
			var peerStatus = {
					name: thisPeer.getUrl(),
					status: 'DOWN'
				}
			//chain.setPrimaryPeer(thisPeer);
			
			return chain.queryChannels(thisPeer);
	
			/*
			
			chain.queryChannels(thisPeer)
				.then((response) => {
					logger.debug('Peer %s has joined channels %s', peerStatus.name, JSON.stringify(response.channels));
					let channels = response.channels;
					for (let i = 0; i < channels.length; i++)  {
						if (channels[i].channel_id == channelName) {
							result.push(peerStatus);
							console.dir(result);
							continue;
						}
					}
				});
					*/
		}
		
	
	})
	.then((response_payloads) => {
		console.dir(response_payloads);
		for(let i = 0; i < response_payloads.length; i++) {
			logger.info('gua! Query results [' + i + ']: %s' + response_payloads[i]);
		}
		return 'aha';
	})
		/*
	
	.then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		
		the_user = admin;
		//the_user.mspImpl._id = util.getMspid(ORGS, org);
		//return chain.initialize();
		return chain.getChannelConfig();
		//return 'peer list from client';
		//return queryBlock(admin, util.getMspid(ORGS, org));
	},
	(err) => {
		util.throwError(logger, err, 'Failed to enroll user \'admin\'. ');
		
	})
	.then(
		function(config_envelope) {
			logger.info('Got config envelope from getChannelConfig :: %j', config_envelope);
			//console.dir(config_envelope);

			let channel = config_envelope.config.channel;
			logger.debug('queryPeers -  Channel version :: %s', channel.version);
			logger.debug('queryPeers -  Channel groups name and originalName:: %s, ', 
					channel.groups.field.name, channel.groups.field.originalName);

			let app_map = channel.groups.map.Application;
			let org1Msp_map = app_map.value.groups.map.Org1MSP;
			logger.debug('queryPeers -  Channel groups maps of %s-%s', 
					app_map.key, org1Msp_map.key);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					org1Msp_map.value.policies.map.Admins.key, 
					org1Msp_map.value.policies.map.Admins.value.mod_policy);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					org1Msp_map.value.policies.map.Readers.key, 
					org1Msp_map.value.policies.map.Readers.value.mod_policy);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					org1Msp_map.value.policies.map.Writers.key, 
					org1Msp_map.value.policies.map.Writers.value.mod_policy);

			let org2Msp_map = app_map.value.groups.map.Org2MSP;
			logger.debug('queryPeers -  Channel groups maps of %s-%s', 
					app_map.key, org2Msp_map.key);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					org1Msp_map.value.policies.map.Admins.key, 
					org1Msp_map.value.policies.map.Admins.value.mod_policy);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					org1Msp_map.value.policies.map.Readers.key, 
					org1Msp_map.value.policies.map.Readers.value.mod_policy);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					org1Msp_map.value.policies.map.Writers.key, 
					org1Msp_map.value.policies.map.Writers.value.mod_policy);

			let orderer_map = channel.groups.map.Orderer;
			let ordererMSP_map = orderer_map.value.groups.map.OrdererMSP;
			logger.debug('queryPeers -  Channel groups maps of %s-%s', 
					orderer_map.key, ordererMSP_map.key);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					ordererMSP_map.value.policies.map.Admins.key, 
					ordererMSP_map.value.policies.map.Admins.value.mod_policy);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					ordererMSP_map.value.policies.map.Readers.key, 
					ordererMSP_map.value.policies.map.Readers.value.mod_policy);
			logger.debug('queryPeers -  Channel groups maps:: (%s, %s)', 
					ordererMSP_map.value.policies.map.Writers.key, 
					ordererMSP_map.value.policies.map.Writers.value.mod_policy);

			logger.debug('queryPeers -  Channel policies name and originalName:: %s, %s', 
					channel.policies.field.name, channel.policies.field.originalName);

			let policy_map = channel.policies.map;
			logger.debug('queryPeers -  Channel policies maps:: (%s, %s)', 
					policy_map.AcceptAllPolicy.key, policy_map.AcceptAllPolicy.value.mod_policy);
			logger.debug('queryPeers -  Channel policies maps:: (%s, %s)', 
					policy_map.Admins.key, policy_map.Admins.value.mod_policy);
			logger.debug('queryPeers -  Channel policies maps:: (%s, %s)', 
					policy_map.Readers.key, policy_map.Readers.value.mod_policy);
			logger.debug('queryPeers -  Channel policies maps:: (%s, %s)', 
					policy_map.Writers.key, policy_map.Writers.value.mod_policy);
		}
	)
	/*

	.then((block) => {
		logger.info('Chain getBlock() returned block number= %s',block.header.number);
		return queryTransactionByTxId(transactionId);
		
	}).then((processed_transaction) => {
		logger.info('Chain queryTransaction() returned processed tranaction validationCode: ' + processed_transaction.validationCode);

		// TODO: return nothing? check what we can get from processed_transaction
		decodeTransaction(processed_transaction, commonProtoPath, transProtoPath);
 
		return chain.queryInfo();
		
	}).then((blockchainInfo) => {
		logger.info('Chain queryInfo() returned blockchain info.');
		logger.info('Chain queryInfo() returned block height = ' + blockchainInfo.height);
		logger.info('Chain queryInfo() returned block previousBlockHash = ' + blockchainInfo.previousBlockHash);
		logger.info('Chain queryInfo() returned block currentBlockHash = ' + blockchainInfo.currentBlockHash);
		var block_hash = blockchainInfo.currentBlockHash;
		result.previousBlockHash = blockchainInfo.previousBlockHash;
		result.currentBlockHash = blockchainInfo.currentBlockHash;

		// send query
		return chain.queryBlockByHash(block_hash);
	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to send query due to error: ');
		return result;
		
	}).then((block) => {
		logger.info(' Chain queryBlockByHash() returned block number=%s',block.header.number);
		logger.info('got back block number '+ block.header.number);
		result.blockNumber = block.header.number.low;

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
			args: ["TransactionId", "Sku", "TradeDate", "TraceInfo"]
		};

		return chain.queryByChaincode(request);
	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to send query chaincode due to error: ');
		return result;
		
	}).then((response_payloads) => {
		logger.info('Chain queryByChaincode() returned response_payloads: ' + response_payloads);
		return parseQuerySupplyChainResponse(response_payloads);

	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to parse query response due to error: ');

	})
	*/
	.catch((err) => {
		logger.error.error('Failed to query with error:' + err.stack ? err.stack : err);
		return result;
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
	}
	catch(err) {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to decode transaction query response.');
	}
	
	if (transactionId == channel_header.tx_id && 0 == processed_transaction.validationCode) {
		return true;
	} else {
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