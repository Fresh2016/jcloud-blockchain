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
 * Transaction service
 * To be injected into transactionController defined in transactionCtl.js
 */
angular.module('transactionService', [])

	// super simple service
	// each function returns a promise object 
	.factory('Transaction', ['$http',function($http) {
		return {
			post : function(data) {
				return $http.post('/api/transaction', data);
			}
		}
	}]);