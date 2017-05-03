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
 * Monitor controller
 * Inject the Monitor service factory defined in monitorSrvc.js into controller
 */
angular.module('monitorController', [])
	.controller('monitorController', ['$scope', '$http', 'Monitor', function($scope, $http, Monitor) {
		
		console.log('Inside monitorController');


		
		$scope.peerList = '';
		$scope.peer0 = '';
		$scope.peer1 = '';
		$scope.peer2 = '';
		$scope.peer3 = '';
		
		// GET Peers method, initial data when loading monitoring page
		Monitor.getOrderers({
	        params: {
	        }
		})
		.success(function(data) {
			bindMonitorData($scope, data);
		});	
		
		// GET Orderers method, initial data when loading monitoring page
		Monitor.getPeers({
	        params: {
	        }
		})
		.success(function(data) {
			bindMonitorData($scope, data);
		});	

		function bindMonitorData($scope, data) {
			console.dir(data);
			if (1 == data.length) {
				$scope.ordererList = data;
				$scope.orderer0 = data[0];
			} else {
				$scope.peerList = data;
				$scope.peer0 = data[0];
				$scope.peer1 = data[1];
				$scope.peer2 = data[2];
				$scope.peer3 = data[3];
			}
		}
		
	}]);