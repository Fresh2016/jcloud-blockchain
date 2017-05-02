createClient = require('./app/client/create-channel.js');
joinClient = require('./app/client/join-channel.js');
installClient = require('./app/client/install-chaincode.js');
invokeClient = require('./app/client/invoke-transaction.js');
queryClient = require('./app/client/query.js');
var mage = require('./app/manage/create-client.js');

//
//mage.create();
//queryClient.queryOrderers('mychannel')
//    .then((response) => {
//        console.log('---------------------------');
//        console.log('queryPeers response: %j\n\n\n', response);
//
//    }).catch((err) => {
//        console.log('Return without querying.');
//        return  new Promise((resolve, reject) => resolve(false));
//    });


//
//queryClient.queryPeers('mychannel')
//    .then((response) => {
//        console.log('---------------------------');
//        console.log('queryPeers response: %j\n\n\n', response);
//
//    }).catch((err) => {
//        console.log('Return without querying.');
//        return  new Promise((resolve, reject) => resolve(false));
//    });

//createClient.createChannel();
//joinClient.joinChannel();
//installClient.installChaincode()
//    .catch((err) => {
//        console.log("############################")
//        err.errName="installChaincodeError";
//        return new Promise((resolve, reject) => reject(err));
//    });

//mage.create("mychannel");
//mage.createChannel("mychannel")
//mage.joinChannel("mychannel")  {"status":"success","message":{"Payloads":{"low":1,"high":0,"unsigned":true}},"id":"2"}

//
//mage.installChaincode();
//mage.instantiateChaincode();
/**
 * init
 * @param channelName
 */
initCreate();
function initCreate(){
    mage.create('mychannel')
        .then((result) => {

           console.log(JSON.stringify(result))
        }).catch((err) => {
            console.log(JSON.stringify(err))
        });
}
//
//var params_invoke_transaction = {
//    rpctime : '2017-04-17 10:00:00',
//    params : {
//        type : 1,
//        chaincode : {
//            name : 'supplychain0',
//            version : 'v0'
//        },
//        ctorMsg : {
//            functionName : 'addNewTrade',
//            args : ['Sku', 'Sku654321', 'TraceInfo', 'uhmmm...we are testing v1 v1 v1...']
//        }
//    },
//    id : 2
//};
//
//var params_query_transaction = {
//    type : '1',
//    chaincode : {
//        name : "supplychain0",
//        version : "v0",
//    },
//    ctorMsg : {
//        functionName : "queryTrade",
//        args : ["Sku", "TradeDate", "TraceInfo"]
//    }
//};
//var params_query_blocknum = {};
//var params_query_blockInfo = {
//    blockNum : 1
//};
//
//var request_query_transaction = {
//    params : {
//        rpctime : '2017-04-17 10:00:00',
//        params : params_query_transaction,
//        id : 2
//    }
//};
//var request_query_blocknum = {
//    params : {
//        rpctime : '2017-05-18 10:00:00',
//        params : params_query_blocknum,
//        id : 2
//    }
//};
//var request_query_blockInfo = {
//    params : {
//        rpctime : '2017-04-17 10:00:00',
//        params : params_query_blockInfo,
//        id : 2
//    }
//};
//
//
//queryClient.queryBlocks(request_query_blocknum.params.rpctime, request_query_blocknum.params.params)
//.then((result) => {
//        console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& %s', JSON.stringify(result));
//
//    })