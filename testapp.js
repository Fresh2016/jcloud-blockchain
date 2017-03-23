createClient = require('./app/client/create-channel.js');
joinClient = require('./app/client/join-channel.js');
installClient = require('./app/client/install-chaincode.js');
instantiateClient = require('./app/client/instantiate-chaincode.js');
invokeClient = require('./app/client/invoke-transaction.js');
queryClient = require('./app/client/query.js');
//queryBlockClient = require('./app/client/query-block.js');

/*
 * for clear docker container and images
docker rm -f $(docker ps -a | grep supplychain | awk '{print $1 }')
docker rmi -f $(docker images | grep supplychain | awk '{print $3 }')
 */


/*
createClient.createChannel('org1')
.then((result) => {
	console.log('API: query result %s', JSON.stringify(result));
	joinClient.joinChannel(sendResponse);
	res.json(result); // return all amounts in JSON format
},
(err) => {
console.error('API: query result %s', result);
res.json('failed');
}).catch((err) => {
console.error('API: query result %s', result);
return 'failed';
});
*/

//installClient.installChaincode(sendResponse);

function sendResponse(result){
	console.log('API: query result %s', JSON.stringify(result));
	var all_good = true;
	for (let num in result) {
		if (result[num] == 'FAILED') {
			all_good = all_good && false;
		}
	}
	if (all_good) {
		console.log('all good');
	
	}
	else {
		console.log('not all good');
	}
}

/*
instantiateClient.instantiateChaincode('org1')
.then((result) => {
	console.log('API: query result %s', JSON.stringify(result));
	res.json(result); // return all amounts in JSON format
},
(err) => {
console.error('API: query result %s', result);
res.json('failed');
}).catch((err) => {
console.error('API: query result %s', result);
return 'failed';
});
*/

/*
 3ea5cdd666183b6945758fd832aadc2c709d708e0c8fa55e9ef1579c1ece459e
 e995ffd1b3c1f7de5c736197e4ce7ab986ecb06b46ec6165d93f6d8592eb3984
 08814632425ab7a59955eb582cf4d06cd349df9081478c33529e7d6b345be2d1
 64571d8b25ee08eb4824e3f7528582aed1709d75f37224aca3219f6fc4627ea1
 4bbcf35db4c9e2e309ed01e8b07c29b0248f55e57f3662b6e338e062afc9ace6
 */


queryClient.queryTransaction('c3d9cd935f82329638066115fe8a69bc118bb22c411119459c8e815202d1b5dc')
.then((result) => {
	console.log('API: query result %s', JSON.stringify(result));
	res.json(result); // return all amounts in JSON format
},
(err) => {
console.error('API: query result %s', result);
res.json('failed');
}).catch((err) => {
console.error('API: query result %s', result);
return 'failed';
});


/*
queryClient.queryPeers('mychannel')
.then((result) => {
	console.log('API: query result %s', JSON.stringify(result));
	res.json(result); // return all amounts in JSON format
},
(err) => {
console.error('API: query result %s', result);
res.json('failed');
}).catch((err) => {
console.error('API: query result %s', result);
return 'failed';
});
*/

/*
invokeClient.invokeChaincode('uhmmm...we are testing ...')
.then((result) => {
	console.log('API: invoke result %s', JSON.stringify(result));
	res.json(result); // return all amounts in JSON format
},
(err) => {
console.error('API: invoke result %s', result);
res.json('failed');
}).catch((err) => {
console.error('API: invoke result %s', result);
return 'failed';
});
*/