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
 * Query controller
 * Inject the Query service factory defined in querySrvc.js into controller
 */
angular.module('queryController', [])
	.controller('queryController', ['$scope', '$http', 'Query', function($scope, $http, Query) {
		
		console.log('Inside queryController');

		$scope.blockNumber = '';
		$scope.sku = '';
		$scope.tradeDate = '';
		$scope.traceInfo = '';
		$scope.currentBlockHash = '';
		$scope.previousBlockHash = '';
		$scope.transactionId = '';
		
		var params_query_transaction = {
		        type : '1',
		        chaincode : {
		        	name : "supplychain0",
		        	version : "v0",
		        },
		        ctorMsg : {
		        	functionName : "queryTrade",
		        	args : ["Sku", "TradeDate", "TraceInfo"]
		        }
			};
		var params_query_blocknum = {};
		var params_query_blockInfo = {
				blockNum : 1
		};
		
		var request_query_transaction = {
		        params : {
					rpctime : '2017-04-17 10:00:00',
			        params : params_query_transaction,
			        id : 2
				}
			};
		var request_query_blocknum = {
		        params : {
					rpctime : '2017-04-17 10:00:00',
			        params : params_query_blocknum,
			        id : 2
				}
			};
		var request_query_blockInfo = {
		        params : {
					rpctime : '2017-04-17 10:00:00',
			        params : params_query_blockInfo,
			        id : 2
				}
			};
		
		// GET method, initial data when loading query page
		Query.get_transaction(request_query_transaction)
		.success(function(data) {
			bindData1($scope, data);
		});	

		Query.get_blocks(request_query_blocknum)
		.success(function(data) {
			bindData2($scope, data);
		});	

		Query.get_blocks(request_query_blockInfo)
		.success(function(data) {
			bindData3($scope, data);
		});	

		// QUERY method, refresh data when click query button
		$scope.query = function() {
			Query.get_transaction(request_query_transaction)
			.success(function(data) {
				bindData1($scope, data);
			});	

			Query.get_blocks(request_query_blocknum)
			.success(function(data) {
				bindData2($scope, data);
			});	

			Query.get_blocks(request_query_blockInfo)
			.success(function(data) {
				bindData3($scope, data);
			});			
		};	

		function bindData1($scope, data) {
			var payloads = data.message.Payloads;
			$scope.sku = payloads.Sku;
			$scope.tradeDate = payloads.TradeDate;
			$scope.traceInfo = payloads.TraceInfo;
		}
		
		function bindData2($scope, data) {
			var payloads = data.message.Payloads;
			$scope.blockNumber = payloads.low;
		}
		
		function bindData3($scope, data) {
			var payloads = data.message.Payloads;
			$scope.currentBlockHash = payloads.data_hash.buffer.data.slice(0,20) + '...';
			$scope.previousBlockHash = payloads.previous_hash.buffer.data.slice(0,20) + '...';
		}
		
	}]);