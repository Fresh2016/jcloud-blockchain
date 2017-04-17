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
invokeClient = require('./client/invoke-transaction.js');
queryClient = require('./client/query.js');

module.exports = function(app) {

	console.log('Inside routes.js');
	
	var that = this;
	this.blockHead = 'init value in routes.js';
	this.traceInfo = 'init value in routes.js';
	
	// API: query chain latest state
	app.get('/v1/supplychain', function(req, res) {
		console.log('API: query chain latest state');
		console.dir(req.query);
		queryClient.queryTransaction(req.query.rpctime, JSON.parse(req.query.params))
		.then((result) => {
			res.json(result);
		}).catch((err) => {
			var result = generateErrorResponse(err, req.query.id);
			res.json(result);
		});
	});	

	// API: query block hight
	app.get('/v1/supplychain/blocks', function(req, res) {
		console.log('API: query orderers status');
		queryClient.queryBlocks(req.query.rpctime, JSON.parse(req.query.params))
		.then((result) => {
			console.log(result);
			res.json(result);
		}).catch((err) => {
			var result = generateErrorResponse(err, req.query.id);
			res.json(result);
		});
	});	


	// API: query orderer list and status
	app.get('/v1/orderers', function(req, res) {
		console.log('API: query orderers status');
		console.dir(req.query);
		queryClient.queryOrderers(req.query.channel)
		.then((result) => {
			console.log(result);
			console.log(hideUrl(result, 'orderer'));
			res.json(hideUrl(result, 'orderer'));
		}).catch((err) => {
			var result = generateErrorResponse(err, req.query.id);
			res.json(result);
		});
	});	

	// API: query peer list and status
	app.get('/v1/peers', function(req, res) {
		console.log('API: query peers status');
		console.dir(req.query);
		queryClient.queryPeers(req.query.channel)
		.then((result) => {
			console.log(result);
			console.log(hideUrl(result, 'peer'));
			res.json(hideUrl(result, 'peer'));
		}).catch((err) => {
			var result = generateErrorResponse(err, req.query.id);
			res.json(result);
		});
	});	

	// API: invoke transaction
	app.post('/v1/supplychain', function(req, res) {
		console.log('API: invoke transaction');
		console.dir(req.body);
		invokeClient.invokeChaincode(req.body.rpctime, req.body.params)
		.then((result) => {
			console.dir(result);
			res.json(result);
		}).catch((err) => {
			var result = generateErrorResponse(err, req.body.id);
			res.json(result);
		});
	});	

};


function generateErrorResponse(err, id) {
	var result = {
			status : 'failed',
			message : {
				Error : err.toString('utf8')
			},
			id : id
		};
	return result;
}


function hideUrl(result, name) {
	for (let i in result) {
		result[i].name = name + i;
	}
	return result;
}