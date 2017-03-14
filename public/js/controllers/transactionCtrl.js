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
		
		// GET method, initial data when loading query page
		// TODO: pass real data from hfc client
		Transaction.get()
			.success(function(data) {
				console.log(data);
				//$scope.loading = false;
				$scope.blockHead = 'empty block head';
				$scope.traceInfo = 'empty trace info';
			});	

		// INVOKE method, refresh data when click query button
		// TODO: pass real data from hfc client
		$scope.invoke = function() {
				Transaction.post()
				.success(function(data) {
					console.log('INVOKE New Trade in transaction controller');
					console.log(data);
					//$scope.loading = false;
					$scope.blockHead = 'Insert your encrypted blockhead here';
					$scope.traceInfo = 'Insert your encrypted TraceInfo here';
				});	
			};	

	}]);