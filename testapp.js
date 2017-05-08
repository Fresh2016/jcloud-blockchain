var createClient = require('./app/client/create-channel.js');
var joinClient = require('./app/client/join-channel.js');
var installClient = require('./app/client/install-chaincode.js');
var invokeClient = require('./app/client/invoke-transaction.js');
var queryClient = require('./app/client/query.js');
var manager = require('./app/manage/create-client.js');
var interClient = require('./app/manage/param-interceptor.js');


var paramsCreateChannel = {
		rpctime : '2017-04-17 10:00:00',
		params : {
			type : 1,
			channel : {
				name : 'mychannel',
				version : 'v0'
			}
		},
		id : 2
	};
var paramsInstallChaincode = {
		rpctime : '2017-04-17 10:00:00',
		params : {
			type : 1,
			channelName : 'mychannel',
			chaincode : {
				name : 'trace',
				version : 'v0'
			}
		},
		id : 2
	};
var paramsUpgradeTransaction = JSON.parse(JSON.stringify(paramsInstallChaincode));
paramsUpgradeTransaction.params.chaincode.version = 'v1';

var paramsInvokeTransaction = {
		rpctime : '2017-04-17 10:00:00',
		params : {
			type : 1,
			chaincode : {
				name : 'trace',
				version : 'v0'
			},
			ctorMsg : {
				functionName : 'iPostSkuBaseInfo',
				args : ['skuId123', 'vendortest', 'traceCode123456', 'hashabcd', 'name123', 'num123', 'ext123', 'sign123', 'time123']
			}
		},
		id : 2
	};

var paramsQueryTransaction = {
		rpctime : '2017-04-17 10:00:00',
		params : {
	        type : 1,
	        chaincode : {
	        	name : 'trace',
	        	version : 'v0',
	        },
	        ctorMsg : {
	        	functionName : 'qGetSkuTransactionListByTraceCode',
	        	args : ['1111']
	        }
		},
		id : 2
	};
var paramsQueryBlocknum = {
		rpctime : '2017-04-17 10:00:00',
		params : {
	        type : 1
		},
		id : 2
};
var paramsQueryBlockInfo = {
		rpctime : '2017-04-17 10:00:00',
		params : {
	        type : 1,
			blockNum : 1
		},
		id : 2
};
var paramsQueryPeer = {
		rpctime : '2017-04-17 10:00:00',
		params : {
	        type : 1
		},
		id : 2
};
var paramsQueryOrderer = {
		rpctime : '2017-04-17 10:00:00',
		params : {
	        type : 1
		},
		id : 2
};

var requestCreateChannel = {
		originalUrl : '/v1',
		query : paramsCreateChannel
	};
//FIXME: Join should not be a separate REST API but automatically done 
// following create request or during initialization
var requestJoinChannel = JSON.parse(JSON.stringify(requestCreateChannel));

var requestInstallChaincode = {
		params : {
			channelName: 'mychannel'
		},
		query : paramsInstallChaincode
	};
var requestInstantiateChaincode = JSON.parse(JSON.stringify(requestInstallChaincode));
var requestUpgradeChaincode = {
		params : {
			channelName: 'mychannel'
		},
		query : paramsUpgradeTransaction
	};
var requestInvokeTransaction = {
		params : {
			channelName: 'mychannel'
		},
		query : paramsInvokeTransaction
	};
var requestQueryTransaction = {
		params : {
			channelName: 'mychannel'
		},
		query : paramsQueryTransaction
	};
var requestQueryBlocknum = {
		params : {
			channelName: 'mychannel'
		},
		query : paramsQueryBlocknum
	};
var requestQueryBlockInfo = {
		params : {
			channelName: 'mychannel'
		},
		query : paramsQueryBlockInfo
	};
var requestQueryPeer = {
		params : {
			channelName: 'mychannel'
		},
		query : paramsQueryPeer
	};
var requestQueryOrderer = {
		params : {
			channelName: 'mychannel'
		},
		query : paramsQueryOrderer
	};


// Detect input args and print hints
if (process.argv.length<=2 || '-h' == process.argv[2] || '-help' == process.argv[2]) {
	console.log('\nNo input args of operation, using default query.\n');
	console.log('Select test items as command args.');

	console.log('\n   Examples:');
    console.log('       # Test all from end to end:');
    console.log('       $ node testapp.js -a\n');

    console.log('       # Test create channel and join channel:');
    console.log('       $ node testapp.js -l 1,2');

    console.log('       # Test create invoke:');
    console.log('       $ node testapp.js -l 7');

    console.log('\n   Numbers and operation mapping:');
    console.log('       1: create channel');
    console.log('       2: join channel');
    console.log('       3: install channel');
    console.log('       4: instantiate channel');
    console.log('       5: upgrade channel');
    console.log('       6: invoke channel');
    console.log('       7: query channel');

} else if ('-a' == process.argv[2]) {
	// Call execute() to do testing of all items
	console.log('\nTesting all from end to end\n');
	execute([1,2,3,4,5,6,7]);

} else if ('-l' == process.argv[2] && null != process.argv[3]) {
	// Call execute() to do testing of selected items
	opr_num_list = process.argv[3].split(',');
	console.log('\nTesting operations of belowing:');
	for (i in opr_num_list) {
		console.log('       ' + translateNumToOperation(opr_num_list[i]));
	}
	execute(opr_num_list);

} else {
	console.log('\nIncorrect input args, using -h or -help for help.\n');
}


// Execute items in serial order
// Only selected items are executed, while others are skipped
function execute(opr_num_list) {
	start()
	.then(() => {
		console.log('\n\n***** TESTAPP: Start testing *****\n\n');
		if (isToDo('create', opr_num_list)) {
			interClient.filterParams(requestCreateChannel, null);
			return createClient.createChannel(requestCreateChannel.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: create channel result %s', JSON.stringify(result));
		if (isToDo('join', opr_num_list)) {
			interClient.filterParams(requestJoinChannel, null);
			return joinClient.joinChannel(requestJoinChannel.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: join channel result %s', JSON.stringify(result));
		if (isToDo('install', opr_num_list)) {
			interClient.filterParams(requestInstallChaincode, null);
			return installClient.installChaincode(requestInstallChaincode.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: install chaincode result %s', JSON.stringify(result));
		if (isToDo('instantiate', opr_num_list)) {
			interClient.filterParams(requestInstantiateChaincode, null);
			return invokeClient.instantiateChaincode(requestInstantiateChaincode.rpctime, requestInstantiateChaincode.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: instantiate chaincode result %s', JSON.stringify(result));
		if (isToDo('upgrade', opr_num_list)) {
			interClient.filterParams(requestUpgradeChaincode, null);
			return installClient.installChaincode(requestUpgradeChaincode.query.params)
					.then((result) => {
						return invokeClient.upgradeChaincode(requestUpgradeChaincode.rpctime, requestUpgradeChaincode.query.params);
					});

		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: upgrade chaincode result %s', JSON.stringify(result));
		if (isToDo('invoke', opr_num_list)) {
			interClient.filterParams(requestInvokeTransaction, null);
			return invokeClient.invokeChaincode(requestInvokeTransaction.rpctime, requestInvokeTransaction.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		//TODO:eventhub断开
		console.log('TESTAPP: invoke chaincode result %s', JSON.stringify(result));
		if (isToDo('query', opr_num_list)) {
			interClient.filterParams(requestQueryTransaction, null);
			return queryClient.queryTransaction(requestQueryTransaction.rpctime, requestQueryTransaction.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: queryTransaction result %s', JSON.stringify(result));
		if (isToDo('query', opr_num_list)) {
			interClient.filterParams(requestQueryTransaction, null);
			return queryClient.queryTransactionHistory(requestQueryTransaction.params.rpctime, requestQueryTransaction.query.params);
		} else {
			return 'Skipped'
		}

//	}).then((result) => {
//		console.log('TESTAPP: queryTransactionHistory result %s', JSON.stringify(result));
//		if (isToDo('query', opr_num_list)) {
//			params = manager.??// FIXME:should be some filter interface from manager
//			return queryClient.isTransactionSucceed(response[0].TransactionId);
//		} else {
//			return 'Skipped'
//		}

	}).then((result) => {
		console.log('TESTAPP: isTransactionSucceed result %s', JSON.stringify(result));
		if (isToDo('query', opr_num_list)) {
			interClient.filterParams(requestQueryPeer, null);
			return queryClient.queryPeers(requestQueryPeer.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: queryPeers result %s', JSON.stringify(result));
		if (isToDo('query', opr_num_list)) {
			interClient.filterParams(requestQueryOrderer, null);
			return queryClient.queryOrderers(requestQueryOrderer.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: queryOrderers result %s', JSON.stringify(result));
		if (isToDo('query', opr_num_list)) {
			interClient.filterParams(requestQueryBlocknum, null);
			return queryClient.queryBlocks(requestQueryBlocknum.params.rpctime, requestQueryBlocknum.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: queryBlocks number result %s', JSON.stringify(result));
		if (isToDo('query', opr_num_list)) {
			interClient.filterParams(requestQueryBlockInfo, null);
			return queryClient.queryBlocks(requestQueryBlockInfo.params.rpctime, requestQueryBlockInfo.query.params);
		} else {
			return 'Skipped'
		}

	}).then((result) => {
		console.log('TESTAPP: queryBlocks info result %s', JSON.stringify(result));
		console.log('### shiying is aaa ###');

	}).catch((err) => {
		console.log('Quit with err: %s', err);
		return false;
	});	
}


function isToDo(operation, opr_num_list) {
	number = translateOperationToNum(operation);
	for (i in opr_num_list) {
		if (number == opr_num_list[i]) {
			return true;
		}
	}
	return false;
}


function start() {
	return Promise.resolve();
}


function translateOperationToNum(operation) {
	if ('create' == operation) {
		return 1;
	} else if ('join' == operation) {
		return 2;
	} else if ('install' == operation) {
		return 3;
	} else if ('instantiate' == operation) {
		return 4;
	} else if ('upgrade' == operation) {
		return 5;
	} else if ('invoke' == operation) {
		return 6;
	} else if ('query' == operation) {
		return 7;
	} else {
		return -1;
	}
}


function translateNumToOperation(number) {
	if (1 == number) {
		return 'create';
	} else if (2 == number) {
		return 'join';
	} else if (3 == number) {
		return 'install';
	} else if (4 == number) {
		return 'instantiate';
	} else if (5 == number) {
		return 'upgrade';
	} else if (6 == number) {
		return 'invoke';
	} else if (7 == number) {
		return 'query';
	} else {
		return 'undefined';
	}
}

/*
//for clear docker container and images
docker rm -f $(docker ps -a | grep trace | awk '{print $1 }')
docker rmi -f $(docker images | grep trace | awk '{print $3 }')
*/


//========================TO BE DELETED=======================================
/*
createClient.createChannel()
.then((result) => {
	console.log('TESTAPP: create channel result %s', JSON.stringify(result));
	return joinClient.joinChannel();
}).then((result) => {
	console.log('TESTAPP: join channel result %s', JSON.stringify(result));
	console.log('shiying is aaaa.');
}).catch((err) => {
	console.log('Return without executing joining');
	return false;
});
//*/


/*
joinClient.joinChannel()
.catch((err) => {
	console.log('Return without executing joining');
	return false;
});
//*/


/*
//TODO：出bug了，两个org的数据不一致？
installClient.installChaincode()
.then(() => {
	console.log('TESTAPP: install chaincode result ');
	return invokeClient.instantiateChaincode();
}).then((result) => {
	console.log('TESTAPP: instantiate chaincode result %s', JSON.stringify(result));
	console.log('shiying is aaaa.');
}).catch((err) => {
	console.log('Return without executing installing and instantiating');
	return false;
});
//*/


/*
invokeClient.instantiateChaincode()
.catch((err) => {
	console.log('Return without executing installing and instantiating');
	return false;
});
//*/


/*
queryClient.queryTransaction(request_query_transaction.params.rpctime, request_query_transaction.params.params)
.then((result) => {
	console.log('queryTransaction response: %j\n\n\n', response);	
	return queryClient.queryTransactionHistory('');

}).then((result) => {
	console.log('queryTransactionHistory response: %j\n\n\n', response);
	return queryClient.isTransactionSucceed(response[0].TransactionId);

}).then((result) => {
	console.log('isTransactionSucceed response: %j\n\n\n', response);
	return queryClient.queryPeers('mychannel');

}).then((result) => {
	console.log('queryPeers response: %j\n\n\n', response);
	return queryClient.queryOrderers('mychannel');

}).then((result) => {
	console.log('queryOrderers response: %j\n\n\n', response);
	return queryClient.queryBlocks(request_query_blocknum.params.rpctime, request_query_blocknum.params.params);

}).then((result) => {
	console.log('queryBlocks number response: %j\n\n\n', response);
	return queryClient.queryBlocks(request_query_blockInfo.params.rpctime, request_query_blockInfo.params.params);

}).then((result) => {
	console.log('queryBlocks info response: %j\n\n\n', response);
	console.log('### shiying is aaa ###');

}).catch((err) => {
	console.log('Return without querying.');
	return false;
});
//*/


/*
invokeClient.invokeChaincode(paramsInvokeTransaction.rpctime, paramsInvokeTransaction.params)
.catch((err) => {
	console.log('Return without executing invoking');
	return false;
});
//*/


/*
installClient.installChaincode()
.then(() => {
	console.log('TESTAPP: install chaincode result ');
	return invokeClient.upgradeChaincode();
}).then((result) => {
	console.log('TESTAPP: upgrade chaincode result %s', JSON.stringify(result));
	console.log('shiying is aaaa.');
}).catch((err) => {
	console.log('Return without executing upgrading');
	return false;
});
//*/