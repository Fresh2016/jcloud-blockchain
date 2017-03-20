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
var copService = require('fabric-ca-client/lib/FabricCAClientImpl.js');
var User = require('fabric-client/lib/User.js');
var CryptoSuite = require('fabric-client/lib/impl/CryptoSuite_ECDSA_AES.js');
var KeyStore = require('fabric-client/lib/impl/CryptoKeyStore.js');
var ecdsaKey = require('fabric-client/lib/impl/ecdsa/key.js');

// Channel and chaincode settings
// TODO: should be managed by manager and stored in DB
module.exports.CHAINCODE_PATH = 'github.com/supplychain';
module.exports.END2END = {
	channel: 'mychannel',
	chaincodeId: 'end2end2',
	chaincodeVersion: 'v0'
};

// Directory for file based KeyValueStore
module.exports.storePathForOrg = function(org) {
	return '/tmp/hfc-test-kvs' + '_' + org;
};

// Clean up KeyValueStore before new operations
module.exports.cleanupDir = function(keyValStorePath) {
	var absPath = path.join(process.cwd(), keyValStorePath);
	var exists = existsSync(absPath);
	if (exists) {
		fs.removeSync(absPath);
	}
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
module.exports.throwError = function throwError(err, desciption){
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


//to be deleted
//temporarily set $GOPATH to the test fixture folder
/*
module.exports.setGOPATH = function() {
	process.env.GOPATH = __dirname;
};
*/

//to be deleted
//specifically set the values to defaults because they may have been overridden when
//running in the overall test bucket ('gulp test')
/*
module.exports.resetDefaults = function() {
	global.hfc.config = undefined;
};
*/
