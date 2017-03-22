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
module.exports.CHAINCODE_PATH = 'github.com/supplychain';
module.exports.channel = 'mychannel';
module.exports.chaincodeId = 'supplychain';
module.exports.chaincodeVersion = 'v0';

// Read config.json information
hfc.addConfigFile('./app/config/config.json');
module.exports.ORGS = hfc.getConfigSetting('test-network');

// Directory for file based KeyValueStore
module.exports.storePathForOrg = function(org) {
	return '/tmp/hfc-test-kvs' + '_' + org;
};

// Clean up KeyValueStore before new operations
module.exports.cleanupDir = function(keyValStorePath) {
	var absPath = keyValStorePath;
	//var absPath = path.join(process.cwd(), keyValStorePath);
	deleteFolderRecursive(absPath);
	//TODO: delete CryptoKeyStore if exists. To be replaced by input para.
	deleteFolderRecursive('C:/Users/shiying1/.hfc-key-store');
	deleteFolderRecursive('~/.hfc-key-store');
};

// Read Org Name from config
module.exports.getOrgNameByOrg = function getOrgNameByOrg(ORGS, org) {
	return ORGS[org].name;
}

// Read MSP ID from config
module.exports.getMspid = function getMspid(ORGS, org) {
	return ORGS[org].mspid;
}

// Process error by logging and throwing new error
module.exports.throwError = function throwError(logger, err, description){
	logger.error(description + err);
	throw new Error(description + err);
}

// Read file
module.exports.readFile = function readFile(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if (!!err)
				reject(new Error('Failed to read file ' + path + ' due to error: ' + err));
			else
				resolve(data);
		});
	});
}


// Check if directory or file exists
// uses entire / absolute path from root
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


// Remove directory recursively
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


//Check status code of all responses to 
//ensure get valid response from all peers
module.exports.checkProposalResponses = 
function checkProposalResponses(proposalResponses, proposal_type, logger) {
	var all_good = true;

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
	
	if (all_good) {
		logger.info('Successfully sent %s Proposal and received ProposalResponse: Status - %s', proposal_type, proposalResponses[0].response.status);
	} else {
		module.exports.throwError(logger, null, 'Failed to send Proposal or receive valid response. Response null or invalid.');
	}
	
	return all_good;
}
