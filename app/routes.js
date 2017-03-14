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

//require('./client/remove-old-key.js');
queryClient = require('./client/query.js');

module.exports = function(app) {

	console.log('Inside routes.js');
	
	var that = this;
	this.blockHead = 'init value in routes.js';
	this.traceInfo = 'init value in routes.js';
	
	// API: query blockinfo
	app.get('/api/query', function(req, res) {
			console.log('API: query blockinfo');
			var result = queryClient.query();
			console.log('API: query result %s', result);
			if (result == 'failed') {
				var jsonData = {blockHead: 'error', traceInfo: 'error'};
			} else
				{
				var jsonData = {blockHead: this.blockHead, traceInfo: this.traceInfo};
				}
			//var jsonData = {blockHead: this.blockHead, traceInfo: this.traceInfo};
			res.json(jsonData); // return all amounts in JSON format
	});	
	
	// API: invoke transaction
	app.post('/api/transaction', function(req, res) {
			console.log('/api/transaction');
			var jsonData = {blockHead: this.blockHead, traceInfo: this.traceInfo};
			res.json(jsonData); // return all amounts in JSON format
	});	

};