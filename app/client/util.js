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
var os = require('os');
var jsrsa = require('jsrsasign');
var KEYUTIL = jsrsa.KEYUTIL;

// Fabric client imports
var hfc = require('fabric-client');

// Channel and chaincode settings
// TODO: should be managed by manager and stored in DB
module.exports.txFilePath = './app/config/mychannel.tx';
module.exports.chaincodePath = 'github.com/sourceproduct';
module.exports.channel = 'mychannel';
module.exports.chaincodeId = 'trace3';
module.exports.chaincodeVersion = 'v0';

// Read config.json information
hfc.addConfigFile('./app/config/config.json');
module.exports.ORGS = hfc.getConfigSetting('test-network');


// Function exports:
module.exports.cleanupDir = cleanupDir;
module.exports.checkProposalResponses = checkProposalResponses;
module.exports.getKeyOfJson = getKeyOfJson;
module.exports.getMspid = getMspid;
module.exports.getOrgs = getOrgs;
module.exports.getOrgNameByOrg = getOrgNameByOrg;
module.exports.getUniqueVersion = getUniqueVersion;
module.exports.getValueOfJson = getValueOfJson;
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
function checkProposalResponses(results, proposal_type, logger) {
	var all_good = true;

	if (null != results && 3 <= results.length) {
		var proposalResponses = results[0];
		for(var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
				one_good = true;
				logger.debug(proposal_type + ' proposal was good');
			} else {
				logger.error(proposal_type + ' proposal was bad');
			}
			all_good = all_good & one_good;
		}
	} else {
		all_good = false;
	}
	
	if (all_good) {
		logger.debug('Successfully sent %s Proposal and received ProposalResponse: Status - %s', proposal_type, proposalResponses[0].response.status);
	} else {
		logger.error('Failed to send Proposal or receive valid ProposalResponse from peers.');
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


function getUniqueVersion(prefix) {
	if (!prefix) prefix = 'v';
	return prefix + Date.now();
};


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


//Directory for file based KeyValueStore
function storePathForOrg(org) {
	return '/tmp/hfc-test-kvs' + '_' + org;
};


//Process error by logging and throwing new error
function throwError(logger, err, description){
	logger.error(description + err);
	throw new Error(description + err);
}
