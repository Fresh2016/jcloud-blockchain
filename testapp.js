//createClient = require('./app/client/create-channel.js');
//joinClient = require('./app/client/join-channel.js');
installClient = require('./app/client/install-chaincode.js');
instantiateClient = require('./app/client/instantiate-chaincode.js');
invokeClient = require('./app/client/invoke-transaction.js');
queryClient = require('./app/client/query.js');
//queryBlockClient = require('./app/client/query-block.js');


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


/*
queryClient.queryTransaction('ca36554c8856b81e946ac40efdaa175b8a5f405d3c351d034eb2f6218ada6f7d')
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
invokeClient.invokeChaincode('')
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