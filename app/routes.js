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

/*
 * Routes
 * Map services of public/services into application interfaces
 */

//createClient = require('./client/create-channel.js');
//joinClient = require('./client/join-channel.js');
//installClient = require('./client/install-chaincode.js');
//instantiateClient = require('./client/instantiate-chaincode.js');
invokeClient = require('./client/invoke-transaction.js');
queryClient = require('./client/query.js');
//queryBlockClient = require('./client/query-block.js');

module.exports = function(app) {

	console.log('Inside routes.js');
	
	var that = this;
	this.blockHead = 'init value in routes.js';
	this.traceInfo = 'init value in routes.js';
	
	// API: query blockinfo
	app.get('/v1/supplychain', function(req, res) {
		console.log('API: query blockinfo');
		queryClient.queryTransaction(req.query.transactionId)
			.then((result) => {
				console.log('API: query result %s', JSON.stringify(result));
				res.json(result); // return all amounts in JSON format
			},
		(err) => {
			console.error('API: query result %s', result);
			res.json('failed');
		}).catch((err) => {
			console.error('API: query result %s', result);
			return 'failed';
		});
	});	

	// API: query peer list and status
	app.get('/v1/peers', function(req, res) {
		console.log('API: query peers status');
		queryClient.queryPeers(req.query.channel, function sendResponse(result) {
			res.json(hideUrl(result));
		});
	});	

	// API: invoke transaction
	app.post('/v1/supplychain', function(req, res) {
		console.log('API: invoke transaction');
		console.dir(req.body);
		invokeClient.invokeChaincode(req.body.traceInfo)
			.then((result) => {
				console.log('API: invoke result %s', JSON.stringify(result));
				res.json(result); // return all amounts in JSON format
			},
		(err) => {
			console.error('API: invoke result %s', result);
			res.json('failed');
		}).catch((err) => {
			console.error('API: invoke result %s', result);
			return 'failed';
		});
	});	

};

function hideUrl(result) {
	for (let i in result) {
		result[i].name = 'peer' + i;
	}
	return result;
}