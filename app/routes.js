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
manageClient = require('./manage/create-client.js');
interClient = require('./manage/param-interceptor.js');
module.exports = function(app) {

	console.log('Inside routes.js');
	
	var that = this;
	this.blockHead = 'init value in routes.js';
	this.traceInfo = 'init value in routes.js';

	//param Interceptor
	app.use(function(req, res, next) {
		var params = req.query.params || req.body.params
		req.query.params =  JSON.parse(params);
		console.log('——————————————————'+req.params.channelnam);
		interClient.filterParams(req, res);
		next();
	});


	// API: query chain latest state
	app.get('/v1/:channelname?', function(req, res) {
		console.log('API: query chain latest state');
		console.dir(req.query);
		//req.query.params['channelName'] = req.params.channelname;
		queryClient.queryTransaction(req.query.rpctime, req.query.params)
		.then((result) => {
			res.json(result);
		}).catch((err) => {
			var result = generateErrorResponse(err, req.query.id);
			res.json(result);
		});
	});	

	// API: query block hight or information
	app.get('/v1/:channelname?/blocks', function(req, res) {
		console.log('API: query blocks heights or information');
		console.dir(req.query);
		//req.query.params['channelName'] = req.params.channelname;
		queryClient.queryBlocks(req.query.rpctime, req.query.params)
		.then((result) => {
			console.log(result);
			res.json(result);
		}).catch((err) => {
			var result = generateErrorResponse(err, req.query.id);
			res.json(result);
		});
	});	


	// API: query orderer list and status
	app.get('/v1/:channelname?/orderers', function(req, res) {
		console.log('API: query orderers status');
		console.dir(req.query);
		queryClient.queryOrderers(req.params.channelname)
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
	app.get('/v1/:channelname?/peers', function(req, res) {
		console.log('API: query peers status');
		console.dir(req.query);
		queryClient.queryPeers(req.params.channelname)
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
	app.post('/v1/:channelname?', function(req, res) {
		console.log('API: invoke transaction');
		console.dir(req.body);
		//req.query.params['channelName'] = req.params.channelname;
		invokeClient.invokeChaincode(req.body.rpctime, req.body.params)
		.then((result) => {
			console.dir(result);
			res.json(result);
		}).catch((err) => {
			var result = generateErrorResponse(err, req.body.id);
			res.json(result);
		});
	});

	//app.all('/v1/createChannel', function(req, res) {
	//	console.log('API: create');
	//	console.dir(req.body);
	//	manageClient.create('mychannel')
	//		.then((result) => {
	//			console.dir(result);
	//			res.json(result);
	//		}).catch((err) => {
	//			//var result = generateErrorResponse(err, req.body.id);
	//			res.json(err);
	//		});
	//});
	//app.all('/v2/test', function(req, res) {
	//	//interClient.filterParams(req, res)
	//	//console.dir(req.body);
	//	console.log('%%%%%%%%%%%%%%%%');
	//	return res.json("123")
	//});
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