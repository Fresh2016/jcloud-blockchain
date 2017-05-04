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

var ClientUtils = require('fabric-client/lib/utils.js');
var util = require('./util.js');

var logger = ClientUtils.getLogger('listen-event');

//Used by join event listener
var defaultExpireTime = 30000;
//Used by decodeTransaction
var commonProtoPath = './node_modules/fabric-client/lib/protos/common/common.proto';


module.exports.addPromise = addPromise;
module.exports.disconnectEventhub = disconnectEventhub;


function addPromise(eventPromises, type, eh, deployId, channel) {
	let txPromise = new Promise((resolve, reject) => {
		// set expireTime as 30s
		registerEvent(eh, type, resolve, reject, defaultExpireTime, deployId, channel);
	});
	eventPromises.push(txPromise);
	// So as to make eh.some stop adding duplicate listener
	return true;
}


function blockEventListener(eh, resolve, reject, handle, deployId, channel, block) {
	logger.debug('Event listener got callback of tx id %s with block', deployId);
	logger.debug('Clearning timeout setting and unregister event');
	clearTimeout(handle);
	eh.unregisterBlockEvent();
	
	if (checkChannelInBlockEvent(channel, block)){
		logger.debug('The new channel has been successfully joined on peer '+ eh.ep.addr);
		resolve();
	} else {
		logger.error('channel_id in block event was invalid');
		reject();
	}
}


function checkChannelInBlockEvent(channel, block) {
	// in real-world situations, a peer may have more than one channels so
	// we must check that this block came from the channel we asked the peer to join
	if(block.data.data.length === 1) {
		// Config block must only contain one transaction
		// set to be able to decode grpc objects
		var grpc = require('grpc');
		var commonProto = grpc.load(commonProtoPath).common;
		var envelope = commonProto.Envelope.decode(block.data.data[0]);
		var payload = commonProto.Payload.decode(envelope.payload);
		var channel_header = commonProto.ChannelHeader.decode(payload.header.channel_header);

		if (channel_header.channel_id === channel) {
			return true;
		}
		return false;
	}	
}


function disconnectEventhub(eventhubs) {
	// TODO: disable disconnectEventhub so that server.js doesn't quit after invoking
//	for(var key in eventhubs) {
//		var eventhub = eventhubs[key];
//		// Disconnect the event hub
//		if (eventhub && eventhub.isconnected()) {
//			logger.info('Disconnecting the event hub');
//			eventhub.disconnect();
//		}
//	}
	return true;
}


function registerEvent(eh, type, resolve, reject, expireTime, deployId, channel) {
	let handle = setTimeout(reject, expireTime);

	logger.debug('Register %s event with deployId %s ', type, deployId);
	
	if ('block' === type) {
		eh.registerBlockEvent((block) => {
			blockEventListener(eh, resolve, reject, handle, deployId, channel, block);
		});
	} else {
		eh.registerTxEvent(deployId, (tx, code) => {
			txEventListener(eh, resolve, reject, handle, deployId, tx, code);
		});
	}
}


function txEventListener(eh, resolve, reject, handle, deployId, tx, code) {
	if (deployId === tx) {
		logger.debug('Event listener for %s now got callback of tx id %s with code %s', deployId, tx, code);
	} else {
		logger.error('Event listener for %s got wrong callback of tx id %s', deployId, tx);
	}
	logger.debug('Clearning timeout setting and unregister event');
	clearTimeout(handle);

	//TODO：目前这里会导致程序异常退出
	//eh.unregisterTxEvent(deployId);

	if(validateCode(code)){
		logger.debug('Transaction has been committed on peer '+ eh.ep.addr);
		resolve();	
	} else {
		logger.error('Transaction was invalid, response code is %s', code);
		reject();
	}
}


function validateCode(code) {
	return (code === 'VALID');
}
