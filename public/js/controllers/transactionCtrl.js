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
 * Transaction controller
 * Inject the Transaction service factory defined in transactionSrvc.js into controller
 */
angular.module('transactionController', [])
	.controller('transactionController', ['$scope', '$http', 'Transaction', function($scope, $http, Transaction) {
	
		console.log('Inside transactionController');
		
		var content = $('body');
		$('div.transaction-view.html').text("" + content.html());		
		
		$scope.loading = true;
		$scope.blockHead = '';
		$scope.traceInfo = '';
		
		// POST method, invoke transaction when click transaction button
		// TODO: pass real data to hfc client
		$scope.post = function() {
			var request = {
					rpctime : '2017-04-17 10:00:00',
					params : {
						type : 1,
						chaincode : {
							name : 'supplychain0',
							version : 'v0'
						},
						ctorMsg : {
							functionName : 'addNewTrade',
							args : ['Sku', 'Sku654321', 'TraceInfo', $scope.traceInfo]
						}
					},
					id : 2
				};
			Transaction.post(request)
				.success(function(data) {
					console.log(data);
					$scope.traceInfo = data.TransactionId;
				});	
		};	

	}]);