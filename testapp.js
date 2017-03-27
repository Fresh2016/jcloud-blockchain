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
queryClient.queryTransaction('')
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
queryClient.queryTransactionHistory('')
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


//queryClient.queryPeers('mychannel', sendResponse);
queryClient.queryOrderers('mychannel', sendResponse);


/*
invokeClient.invokeChaincode('uhmmm...we are testing ...again')
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