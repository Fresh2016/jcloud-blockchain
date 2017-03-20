//createClient = require('./app/client/create-channel.js');
//joinClient = require('./app/client/join-channel.js');
//installClient = require('./app/client/install-chaincode.js');
//instantiateClient = require('./app/client/instantiate-chaincode.js');
invokeClient = require('./app/client/invoke-transaction.js');
queryClient = require('./app/client/query.js');
//queryBlockClient = require('./app/client/query-block.js');

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