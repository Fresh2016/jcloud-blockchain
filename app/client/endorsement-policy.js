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

var util = require('./util.js');

var ORGS = util.ORGS;
var orgList = util.getOrgs(ORGS);

const MEMBER = 'member';
const ADMIN = 'admin';


var ONE_OF_TWO_ORG_MEMBER = generateEndorsementPolicy(
	generatePolicy(
		'1-of', generateSignedList([], [0, 1])
	)
);

var TWO_OF_TWO_ORG_MEMBER = generateEndorsementPolicy(
	generatePolicy(
		'2-of', generateSignedList([], [0, 1])
	)
);

var ONE_OF_TWO_ORG_MEMBER_AND_ADMIN = generateEndorsementPolicy(
	generatePolicy(
		'2-of', generateSignedList(
			[
			 	generatePolicy(
		 			'1-of', generateSignedList([], [0, 1])
			 	)
			],
			[2]
		)
	)
);

var ONE_OF_ADMIN_ORG_OR_BOTH_MEMBER = generateEndorsementPolicy(
	generatePolicy(
		'1-of', generateSignedList(
			[
			 	generatePolicy(
			 		'2-of', generateSignedList([], [0, 1])
			 	)
			],
			[2]
		)
	)
);


//console.dir(ONE_OF_TWO_ORG_MEMBER.policy);
//console.dir(TWO_OF_TWO_ORG_MEMBER.policy);
//console.dir(ONE_OF_TWO_ORG_MEMBER_AND_ADMIN.policy);
//console.dir(ONE_OF_ADMIN_ORG_OR_BOTH_MEMBER.policy);
//console.dir(ONE_OF_ADMIN_ORG_OR_BOTH_MEMBER.policy['1-of'][0]);

module.exports.ONE_OF_TWO_ORG_MEMBER = ONE_OF_TWO_ORG_MEMBER;
module.exports.TWO_OF_TWO_ORG_MEMBER = TWO_OF_TWO_ORG_MEMBER;
module.exports.ONE_OF_TWO_ORG_MEMBER_AND_ADMIN = ONE_OF_TWO_ORG_MEMBER_AND_ADMIN;
module.exports.ONE_OF_ADMIN_ORG_OR_BOTH_MEMBER = ONE_OF_ADMIN_ORG_OR_BOTH_MEMBER;


function generateEndorsementPolicy(policy) {
	return {
		identities: getOrgMembersAndAdmins(ORGS, orgList, ['org1']),
		policy: policy
	};
}


function generatePolicy(expr, signedList) {
	var policy = {};
	policy[expr] = signedList;
	return policy;
}


function generateRole(role, org) {
	return {
		role: {
			name: role,
			mspId: util.getMspid(ORGS, org)
		}
	};
}


function generateSignedList(signedList, list) {
	list.forEach((index) => {
		signedList.push(signedBy(index));
	});
	return signedList;
}


function getOrgMembersAndAdmins(ORGS, orgList, adminList) {
	var identities = [];
	orgList.forEach((org) => {
		pushRole(identities, MEMBER, org);
	});
	adminList.forEach((org) => {
		pushRole(identities, ADMIN, org);
	});
	return identities;
}


function pushRole(identities, role, org){
	identities.push(generateRole(role, org));
}


function signedBy(orgNum) {
	return { 'signed-by': orgNum };
}