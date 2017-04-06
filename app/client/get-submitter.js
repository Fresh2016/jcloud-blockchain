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


var hfc = require('fabric-client');
var util = require('./util.js');
var User = require('fabric-client/lib/User.js');
var copService = require('fabric-ca-client/lib/FabricCAClientImpl.js');
var CryptoSuite = require('fabric-client/lib/impl/CryptoSuite_ECDSA_AES.js');
var KeyStore = require('fabric-client/lib/impl/CryptoKeyStore.js');
var ecdsaKey = require('fabric-client/lib/impl/ecdsa/key.js');

var ORGS = util.ORGS;

var defaultUserOrg = 'org1';
var defaultUsrname = 'admin';
var defaultPwd = 'adminpw';

module.exports.getSubmitter = getSubmitter;


function getSubmitter(client, userOrg, logger) {
	var caUrl = ORGS[userOrg].ca;
	var username = defaultUsrname;
	var password = defaultPwd;
	var loadFromConfig = false;

	return client.getUserContext(username)
	.then((user) => {
		return new Promise((resolve, reject) => {
			if (user && user.isEnrolled()) {
				logger.debug('Successfully loaded member from persistence');
				return resolve(user);
			}

			if (!loadFromConfig) {
				// need to enroll it with CA server
				var cop = new copService(caUrl);

				var member;
				return cop.enroll({
					enrollmentID: username,
					enrollmentSecret: password
				}).then((enrollment) => {
					logger.debug('Successfully enrolled user \'' + username + '\'');

					member = new User(username, client);
					return member.setEnrollment(enrollment.key, enrollment.certificate);
				}).then(() => {
					return client.setUserContext(member);
				}).then(() => {
					return resolve(member);
				}).catch((err) => {
					logger.error('Failed to enroll and persist user with error: ' + err.stack ? err.stack : err);
					return 'failed';
				});
			} else {
				// need to load private key and pre-enrolled certificate from files based on the MSP
				// config directory structure:
				// <config>
				//    \_ keystore
				//       \_ admin.pem  <<== this is the private key saved in PEM file
				//    \_ signcerts
				//       \_ admin.pem  <<== this is the signed certificate saved in PEM file

				// first load the private key and save in the BCCSP's key store
				var privKeyPEM = path.join(__dirname, '../fixtures/msp/local/keystore/admin.pem');
				var pemData, member;
				return util.readFile(privKeyPEM)
				.then((data) => {
					pemData = data;
					// default crypto suite uses $HOME/.hfc-key-store as key store
					var kspath = CryptoSuite.getDefaultKeyStorePath();
					var testKey;
					return new KeyStore({
						path: kspath
					});
				}).then((store) => {
					var rawKey = KEYUTIL.getKey(pemData.toString());
					testKey = new ecdsaKey(rawKey);
					return store.putKey(testKey);
				}).then((value) => {
					// next save the certificate in a serialized user enrollment in the state store
					var certPEM = path.join(__dirname, '../fixtures/msp/local/signcerts/admin.pem');
					return util.readFile(certPEM);
				}).then((data) => {
					member = new User(username, client);
					return member.setEnrollment(testKey, data.toString());
				}).then(() => {
					return client.setUserContext(member);
				}).then((user) => {
					return resolve(user);
				}).catch((err) => {
					reject(new Error('Failed to load key or certificate and save to local stores. ' + err));
					return 'failed';
				});
			}
		});
	});
}