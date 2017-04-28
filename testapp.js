createClient = require('./app/client/create-channel.js');
joinClient = require('./app/client/join-channel.js');
installClient = require('./app/client/install-chaincode.js');
invokeClient = require('./app/client/invoke-transaction.js');
queryClient = require('./app/client/query.js');

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
	console.log('shiying is aaaa.');
	//res.json(result); // return all amounts in JSON format
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
*/


///*
//TODO：出bug了，两个org的数据不一致？
installClient.installChaincode()
.then(() => {
	console.log('API: create channel result ');
	//console.log('API: create channel result %s', JSON.stringify(result));
	return invokeClient.instantiateChaincode();
}).then((result) => {
	console.log('shiying is aaaa.');
	//res.json(result); // return all amounts in JSON format
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
*/


//TODO:eventhub断开
/*
//transaction_id = 'e1127348d390a07f335801fa2b2b1752451b7bc36448e05e36f749ba1ce0cf91'
//queryClient.isTransactionSucceed(transaction_id)
//.then((response) => {
//	console.log('isTransactionSucceed response: %j\n\n\n', response);
//	return queryClient.queryTransaction('');
	
//}).then((response) => {

queryClient.queryTransaction('')
.then((response) => {
	console.log('queryTransaction response: %j\n\n\n', response);	
	return queryClient.queryTransactionHistory('');

}).then((response) => {
	console.log('queryTransactionHistory response: %j\n\n\n', response);
	return queryClient.queryPeers('mychannel');

}).then((response) => {
	console.log('queryPeers response: %j\n\n\n', response);
	return queryClient.queryOrderers('mychannel');

}).then((response) => {
	console.log('queryOrderers response: %j\n\n\n', response);
	console.log('### shiying is aaa ###');

}).catch((err) => {
	console.log('Return without querying.');
	return false;
});
//*/


/*
invokeClient.invokeChaincode('uhmmm...we are testing 3...')
.catch((err) => {
	console.log('Return without executing installing and instantiating');
	return false;
});
*/
