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

// System imports
var path = require('path');
var fs = require('fs-extra');

// Fabric client imports
var hfc = require('fabric-client');


// Function exports:
//Channel and chaincode settings
module.exports.getBlockNum = getBlockNum;
module.exports.getChannel = getChannel;
module.exports.getChaincodePath = getChaincodePath;
module.exports.getChaincodeId = getChaincodeId;
module.exports.getChaincodeVersion = getChaincodeVersion;
module.exports.getFunctionName = getFunctionName;
module.exports.getFunctionArgs = getFunctionArgs;
module.exports.getNetwork = getNetwork;
module.exports.getTxFileData = getTxFileData;

// Utilities
module.exports.cleanupDir = cleanupDir;
module.exports.checkProposalResponses = checkProposalResponses;
module.exports.getCaRoots = getCaRoots;
module.exports.getKeyOfJson = getKeyOfJson;
module.exports.getMspid = getMspid;
module.exports.getOrgs = getOrgs;
module.exports.getOrgNameByOrg = getOrgNameByOrg;
module.exports.getUniqueVersion = getUniqueVersion;
module.exports.getValueOfJson = getValueOfJson;
//TODO: to be deleted after tls also passing from manager
module.exports.readFile = readFile;
module.exports.storePathForOrg = storePathForOrg;
module.exports.throwError = throwError;


//Clean up KeyValueStore before new operations
function cleanupDir(keyValStorePath) {
	var absPath = keyValStorePath;
	//var absPath = path.join(process.cwd(), keyValStorePath);
	deleteFolderRecursive(absPath);
	//TODO: delete CryptoKeyStore if exists. To be replaced by input para.
	deleteFolderRecursive('C:/Users/shiying1/.hfc-key-store');
	deleteFolderRecursive('~/.hfc-key-store');
};


//Check status code of all responses to 
//ensure get valid response from all peers
function checkProposalResponses(chain, results, proposal_type, logger) {
	var all_good = true;

	try {
		var proposalResponses = results[0];
		proposalResponses.forEach((proposalResponse) => {
			all_good = all_good & checkResponse(chain, proposalResponse, proposal_type, logger);
		});

		all_good = compareProposalResponseResults(chain, proposalResponses, all_good, proposal_type, logger);

	} catch(err) {
		all_good = false;
	}

	logger.debug('%s proposal responses are all same or not: %s', proposal_type, Boolean(all_good));
	return all_good;
}


//Verify if proposal response is valid. 
//Skip verifying but only checking response status,
//in case of install and input chain is empty 
function checkResponse(chain, proposalResponse, proposal_type, logger) {
	var one_good = false;

	try {
		if (proposalResponse.response && proposalResponse.response.status === 200) {
			if (null != chain) {
				one_good = chain.verifyProposalResponse(proposalResponse);
			} else {
				one_good = true;
			}
		}
	} catch(err) {
		one_good = false;
	}

	logger.debug('%s proposal was verified as: %s', proposal_type, Boolean(one_good));
	return one_good;
}


//Check all the read/write sets to see if the same, verify that each peer
//got the same results on the proposal. 
//Skip checking if chain is empty in case of install
function compareProposalResponseResults(chain, proposalResponses, all_good, proposal_type, logger) {
	try {
		if (all_good && null != chain) {
			// TODO: wait until SDK fix its bug
			logger.info('Skip compare proposal response results as there are bugs in SDK');
			//all_good = chain.compareProposalResponseResults(proposalResponses);
		}
		if (all_good) {
			logger.debug('Successfully sent %s Proposal and received ProposalResponse: Status - %s', proposal_type, proposalResponses[0].response.status);
		} else {
			logger.error('Failed to send Proposal or receive valid ProposalResponse from peers.');
		}
	} catch(err) {
		all_good = false;
	}

	return all_good;
}


//Remove directory recursively
function deleteFolderRecursive(path) {
 var files = [];
 if( fs.existsSync(path) ) {
     files = fs.readdirSync(path);
     files.forEach(function(file,index){
         var curPath = path + "/" + file;
         if(fs.statSync(curPath).isDirectory()) { // recurse
             deleteFolderRecursive(curPath);
         } else { // delete file
             fs.unlinkSync(curPath);
         }
     });
     fs.rmdirSync(path);
 }
}


//Check if directory or file exists
//uses entire / absolute path from root
function existsSync(absolutePath /*string*/) {
	try  {
		var stat = fs.statSync(absolutePath);
		if (stat.isDirectory() || stat.isFile()) {
			return true;
		} else
			return false;
	}
	catch (e) {
		return false;
	}
};


function getBlockNum(params) {
	return params.blockNum;
}


// Read CA root pem files
function getCaRoots(nodeInfo) {
	var caRootsPath = getCaRootsPath(nodeInfo);
	let data = readFileSync(caRootsPath);
	return Buffer.from(data).toString();
}


function getCaRootsPath(nodeInfo) {
	return nodeInfo.tls_cacerts;
}


function getChannel(params) {
	return params.channelName;
}


function getChaincodePath(params) {
	return params.chaincode.path;
}


function getChaincodeId(params) {
	return params.chaincode.name;
}


function getChaincodeVersion(params) {
	return params.chaincode.version;
}


function getFunctionName(params) {
	return params.ctorMsg.functionName;
}


function getFunctionArgs(params) {
	return params.ctorMsg.args;
}


function getNetwork(params) {
	return params.network;
}


function getTxFileData(params) {
	return params.channel.txFileData;
}


//Return all keys matches keyword, not strictly
function getKeyOfJson(jsonObj, keyword) {
	var list = [];
	for (let key in jsonObj) {
		if (jsonObj.hasOwnProperty(key)) {
			if (key.indexOf(keyword) === 0) {
				list.push(key);
			}
		}
	}
	return list;
}


//Read MSP ID from config
function getMspid(ORGS, org) {
	return ORGS[org].mspid;
}


//Read Org from config
function getOrgs(ORGS) {
	return module.exports.getKeyOfJson(ORGS, 'org');
}

	
// Read Org Name from config
function getOrgNameByOrg(ORGS, org) {
	return ORGS[org].name;
}


function getUniqueVersion(prefix) {
	if (!prefix) prefix = 'v';
	return prefix + Date.now();
};


//Return all values matches keyword, not strictly
function getValueOfJson(jsonObj, keyword) {
	var list = [];
	for (let key in jsonObj) {
		if (jsonObj.hasOwnProperty(key)) {
			if (key.indexOf(keyword) === 0) {
				list.push(jsonObj[key]);
			}
		}
	}
	return list;
}


//Read file
function readFile(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if (!!err)
				reject(new Error('Failed to read file ' + path + ' due to error: ' + err));
			else
				resolve(data);
		});
	});
}


//Read file
function readFileSync(path) {
	return fs.readFileSync(path);
}


//Directory for file based KeyValueStore
function storePathForOrg(org) {
	return '/tmp/hfc-test-kvs' + '_' + org;
};


//Process error by logging and throwing new error
function throwError(logger, err, description){
	logger.error(description + err);
	throw new Error(description + err);
}
