module.exports.queryTransaction = function(transactionId) {
	logger.info('\n\n***** Hyperledger fabric client: query transaction by transactionId: %s *****', transactionId);
	
	var org = defaultOrg;
	var orgName = util.getOrgNameByOrg(ORGS, org);

	setupChain(ORGS, orgName, org);
	
	return hfc.newDefaultKeyValueStore({
		path: util.storePathForOrg(orgName)
		
	}).then((store) => {
		client.setStateStore(store);
		return Submitter.getSubmitter(client, org, logger);

	}).then((admin) => {
		logger.debug('Successfully enrolled user \'admin\'');
		the_user = admin;
		the_user.mspImpl._id = mspid;

		// use default primary peer
		return chain.queryBlock(0);
	},
	(err) => {
		util.throwError(logger, err, 'Failed to enroll user \'admin\'. ');
		
	}).then((block) => {
		logger.debug('Chain queryBlock() returned block number = %s',block.header.number);
		logger.info('Chain queryBlock() returned block previousBlockHash = ' + block.header.previous_hash);
		logger.info('Chain queryBlock() returned block currentBlockHash = ' + block.header.data_hash);
		result.previousBlockHash = block.header.previous_hash;
		result.currentBlockHash = block.header.data_hash;
		
		// use default primary peer
		return chain.queryInfo();
		
	}).then((blockchainInfo) => {
		logger.info('Chain queryInfo() returned blockchain info.');
		logger.info('Chain queryInfo() returned block height = ' + blockchainInfo.height);
		logger.info('Chain queryInfo() returned block previousBlockHash = ' + blockchainInfo.previousBlockHash);
		logger.info('Chain queryInfo() returned block currentBlockHash = ' + blockchainInfo.currentBlockHash);
		var block_hash = blockchainInfo.currentBlockHash;
		result.previousBlockHash = blockchainInfo.previousBlockHash;
		result.currentBlockHash = blockchainInfo.currentBlockHash;

		// use default primary peer
		return chain.queryBlockByHash(block_hash);
	},
	(err) => {
		util.throwError(logger, err.stack ? err.stack : err, 'Failed to send query due to error: ');
		return result;
		
	}).then((block) => {
		logger.info(' Chain queryBlockByHash() returned block number=%s', block.header.number);
		logger.info('got back block number '+ block.header.number);
		result.blockNumber = block.header.number.low;

	}).catch((err) => {
		logger.error('Failed to query with error:' + err.stack ? err.stack : err);
		return result;
	});
}