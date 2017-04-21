createClient = require('./app/client/create-channel.js');
joinClient = require('./app/client/join-channel.js');
installClient = require('./app/client/install-chaincode.js');
invokeClient = require('./app/client/invoke-transaction.js');
queryClient = require('./app/client/query.js');



var params_invoke_transaction = {
		rpctime : '2017-04-17 10:00:00',
		params : {
			type : 1,
			chaincode : {
				name : 'supplychain0',
				version : 'v0'
			},
			ctorMsg : {
				functionName : 'addNewTrade',
				args : ['Sku', 'Sku654321', 'TraceInfo', 'uhmmm...we are testing v1 v1 v1...']
			}
		},
		id : 2
	};

var params_query_transaction = {
        type : '1',
        chaincode : {
        	name : "supplychain0",
        	version : "v0",
        },
        ctorMsg : {
        	functionName : "queryTrade",
        	args : ["Sku", "TradeDate", "TraceInfo"]
        }
	};
var params_query_blocknum = {};
var params_query_blockInfo = {
		blockNum : 1
};

var request_query_transaction = {
        params : {
			rpctime : '2017-04-17 10:00:00',
	        params : params_query_transaction,
	        id : 2
		}
	};
var request_query_blocknum = {
        params : {
			rpctime : '2017-04-17 10:00:00',
	        params : params_query_blocknum,
	        id : 2
		}
	};
var request_query_blockInfo = {
        params : {
			rpctime : '2017-04-17 10:00:00',
	        params : params_query_blockInfo,
	        id : 2
		}
	};


/*
//for clear docker container and images
docker rm -f $(docker ps -a | grep supplychain | awk '{print $1 }')
docker rmi -f $(docker images | grep supplychain | awk '{print $3 }')
*/


/*
createClient.createChannel()
.then((result) => {
	console.log('API: create channel result %s', JSON.stringify(result));
	return joinClient.joinChannel();
}).then((result) => {
	console.log('API: join channel result %s', JSON.stringify(result));
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
	console.log('API: install chaincode result ');
	return invokeClient.instantiateChaincode();
}).then((result) => {
	console.log('API: instantiate chaincode result %s', JSON.stringify(result));
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


//TODO:eventhub断开
/*
queryClient.queryTransaction(request_query_transaction.params.rpctime, request_query_transaction.params.params)
.then((response) => {
	console.log('queryTransaction response: %j\n\n\n', response);	
	return queryClient.queryTransactionHistory('');

}).then((response) => {
	console.log('queryTransactionHistory response: %j\n\n\n', response);
	return queryClient.isTransactionSucceed(response[0].TransactionId);

}).then((response) => {
	console.log('isTransactionSucceed response: %j\n\n\n', response);
	return queryClient.queryPeers('mychannel');

}).then((response) => {
	console.log('queryPeers response: %j\n\n\n', response);
	return queryClient.queryOrderers('mychannel');

}).then((response) => {
	console.log('queryOrderers response: %j\n\n\n', response);
	return queryClient.queryBlocks(request_query_blocknum.params.rpctime, request_query_blocknum.params.params);

}).then((response) => {
	console.log('queryBlocks number response: %j\n\n\n', response);
	return queryClient.queryBlocks(request_query_blockInfo.params.rpctime, request_query_blockInfo.params.params);

}).then((response) => {
	console.log('queryBlocks info response: %j\n\n\n', response);
	console.log('### shiying is aaa ###');

}).catch((err) => {
	console.log('Return without querying.');
	return false;
});
//*/


/*
invokeClient.invokeChaincode(params_invoke_transaction.rpctime, params_invoke_transaction.params)
.catch((err) => {
	console.log('Return without executing invoking');
	return false;
});
//*/


/*
installClient.installChaincode()
.then(() => {
	console.log('API: install chaincode result ');
	return invokeClient.upgradeChaincode();
}).then((result) => {
	console.log('API: upgrade chaincode result %s', JSON.stringify(result));
	console.log('shiying is aaaa.');
}).catch((err) => {
	console.log('Return without executing upgrading');
	return false;
});
//*/