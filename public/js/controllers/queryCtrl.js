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
	.controller('queryController', ['$scope', '$http', 'BlockInfo', function($scope, $http, Balance) {
		
		console.log('Inside queryController');

		$scope.loading = true;
		$scope.blockHead = '';
		$scope.traceInfo = '';
		
		// GET method
		// TODO: pass real data from hfc client
		BlockInfo.get()
			.success(function(data) {
				console.log(data);
				//$scope.loading = false;
				$scope.blockHead = 'empty block head';
				$scope.traceInfo = 'empty trace info';
			});	
		
	}]);