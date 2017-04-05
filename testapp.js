createClient = require('./app/client/create-channel.js');
joinClient = require('./app/client/join-channel.js');
installClient = require('./app/client/install-chaincode.js');
invokeClient = require('./app/client/invoke-transaction.js');
queryClient = require('./app/client/query.js');

/*
 * for clear docker container and images
docker rm -f $(docker ps -a | grep supplychain | awk '{print $1 }')
docker rmi -f $(docker images | grep supplychain | awk '{print $3 }')
 */


createClient.createChannel()
.then((result) => {
	console.log('API: query result %s', JSON.stringify(result));
	joinClient.joinChannel(sendResponse);
	res.json(result); // return all amounts in JSON format
});



//installClient.installChaincode(sendResponse);
//invokeClient.instantiateChaincode(sendResponse);


//queryClient.isTransactionSucceed('45907971aeea190eda997232f8147f14e8e0c911a0484bbb883a0c9d10a0ad83', sendResponse);
//queryClient.queryTransaction('', sendResponse);
//queryClient.queryTransactionHistory('', sendResponse);

// TODO:还需要测试杀掉peer时不挂啊
//queryClient.queryPeers('mychannel', sendResponse);
//queryClient.queryOrderers('mychannel', sendResponse);

//invokeClient.invokeChaincode('uhmmm...we are testing ...', sendResponse);





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