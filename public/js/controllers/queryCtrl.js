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
 * Inject the BlockInfo service factory defined in querySrvc.js into controller
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
		
		var request = {
				transactionId : ''
			};
		
		// GET method, initial data when loading query page
		Query.get({
	        params: {
	        	transactionId: 'ebaee52e1994d93232b94322557f9348777f9d8b74c91398f8fcc896aa212b88'//$scope.transactionId
	        }			
		})
		.success(function(data) {
			bindData($scope, data);
		});	

		/*
		$http.get('accept.php', {
	        params: {
	            source: link,
	            category_id: category
	        }
	     })
	     .success(function (data,status) {
	          $scope.info_show = data
	     });		
		*/
		
		// QUERY method, refresh data when click query button
		$scope.query = function() {
			request.transactionId = $scope.transactionId;
			Query.get(request)
				.success(function(data) {
					bindData($scope, data);
				});	
			};	

		function bindData($scope, data) {
			$scope.blockNumber = data.blockNumber;
			$scope.sku = data.sku;
			$scope.tradeDate = data.tradeDate;
			$scope.traceInfo = data.traceInfo;
			$scope.currentBlockHash = data.currentBlockHash;
			$scope.previousBlockHash = data.previousBlockHash;
			$scope.transactionId = data.transactionId;
		}
		
	}]);