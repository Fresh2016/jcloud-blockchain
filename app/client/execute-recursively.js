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

var ClientUtils = require('fabric-client/lib/utils.js');

var logger = ClientUtils.getLogger('execute-recursively');

module.exports.executeTheNext = executeTheNext;


function executeTheNext(orgs, functionByOrg, functionParams, actionString) {
	// Get orgs executing some action one by one until all orgs done
	// e.g. functionByOrg is joinChannelByOrg and actionString is 'Join Channel'
	let org = pop(orgs);
	
	return functionByOrg(org, functionParams)
	.then((response) => {
		logger.info('Organization %s successfully %s', org, actionString);
		logger.debug('Get success responses: %j', response);
		if (0 < orgs.length) {
			return executeTheNext(orgs, functionByOrg, functionParams, actionString);
		} else {
			logger.info('END of %s.', actionString);
			return new Promise((resolve, reject) => resolve(response));
		}
		return true;
	});
	// No catch() needed as the calling function will do it at the end
}


function pop(list) {
	logger.debug('Poping cell from %s', JSON.stringify(list));
	if (list) {
		var component = list[0];
		list.splice(0, 1);
		logger.debug('Successfully pop %s, now list becomes %s', JSON.stringify(component), JSON.stringify(list));
		return component;
	} else {
		logger.error('Empty list, return nothing.');
		return null;
	}
}