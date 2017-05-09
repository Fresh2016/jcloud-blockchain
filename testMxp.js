createClient = require('./app/client/create-channel.js');
joinClient = require('./app/client/join-channel.js');
installClient = require('./app/client/install-chaincode.js');
invokeClient = require('./app/client/invoke-transaction.js');
queryClient = require('./app/client/query.js');
var mage = require('./app/manage/create-client.js');
var request = require('request');
var rf = require("fs");

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
//initCreate();
//function initCreate(){
//    mage.create('mychannel')
//        .then((result) => {
//
//           console.log(JSON.stringify(result))
//        }).catch((err) => {
//            console.log(JSON.stringify(err))
//        });
//}
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

//
//mychannel();
//function mychannel() {
//    var params = {
//        type: 1,
//        chaincode: {
//            name: 'trace1',
//            version: 'v0'
//        },
//        ctorMsg: {
//            functionName: 'iPostSkuBaseInfo',
//            args: ["skuId123", "vendortest", "traceCode123456", "hashabcd", "name123", "num123", "ext123", "sign123", "time123"]
//        }
//    };
//    params =JSON.stringify(params)
//
//
//
//    request({
//            method: 'POST',
//            uri : "http://localhost:8081/v1/mychannel",
//            json :
//                { rpctime: '2017-04-17 10:00:00',
//                    params:params,
//                    id: 2
//                }
//        }, function(err,res,body){
//            console.log(JSON.stringify(err))
//            console.log(JSON.stringify(body))
//        }
//    )
//}
//
//console.log(process.argv);



var param = {
    "type": 1,
    "channel":{

    },
    "chaincode": {
        "name": "trace",
        "version": "v0",
        "path": "github.com/trace"
    },
    "ctorMsg": {
        "functionName": "qGetSkuTransactionListByTraceCode",
        "args": [
            "1111"
        ]
    },
    "channelName": "mychannel",
    "network": {
        "orderer": {
            "url": "grpcs://202.77.131.6:7050",
            "server-hostname": "orderer0",
            "tls_cacerts": "./app/manage/data/tls/orderer/ca-cert.pem"
        },
        "org1": {
            "name": "peerOrg1",
            "mspid": "Org1MSP",
            "ca": "https://202.77.131.6:7054",
            "peer1": {
                "requests": "grpcs://202.77.131.6:7056",
                "events": "grpcs://202.77.131.6:7058",
                "server-hostname": "peer1",
                "tls_cacerts": "./app/manage/data/tls/peers/peer1/ca-cert.pem",
                "isAnchor": "true",
                "assign": "org1"
            },
            "num": 1
        },
        "org2": {
            "name": "peerOrg2",
            "mspid": "Org2MSP",
            "ca": "https://202.77.131.6:8054",
            "peer1": {
                "requests": "grpcs://202.77.131.6:8056",
                "events": "grpcs://202.77.131.6:8058",
                "server-hostname": "peer3",
                "tls_cacerts": "./app/manage/data/tls/peers/peer3/ca-cert.pem",
                "isAnchor": "true",
                "assign": "org2"
            },
            "num": 1
        }
    }
}

//var config = require('./app/manage/data/channel.js').getConfig();
//var txFilePath = config["mychannel"].txFilePath;
//var data = rf.readFileSync(txFilePath);
//param.channel.txFileData = data;

//mage.create(param)
//    .then((result) => {
//        console.log('$$$$$$$$$$$$$$$$$$init success %s',JSON.stringify(result));
//        return true;
//    }).catch((err) => {
//        console.log('+++++++++++++++++++init failed %s',JSON.stringify(err));
//        return false;
//    });

//mage.createChannel(param)
//    .then((result) => {
//        console.log('$$$$$$$$$$$$$$$$$$init success %s',JSON.stringify(result));
//        return true;
//    }).catch((err) => {
//        console.log('+++++++++++++++++++init failed %s',JSON.stringify(err));
//        return false;
//    });

//mage.joinChannel(param)
//    .then((result) => {
//        console.log('$$$$$$$$$$$$$$$$$$init success %s',JSON.stringify(result));
//        return true;
//    }).catch((err) => {
//        console.log('+++++++++++++++++++init failed %s',JSON.stringify(err));
//        return false;
//    });

//
//mage.installChaincode(param)
//    .then((result) => {
//        console.log('$$$$$$$$$$$$$$$$$$init success %s',JSON.stringify(result));
//        return true;
//    }).catch((err) => {
//        console.log('+++++++++++++++++++init failed %s',JSON.stringify(err));
//        return false;
//    });

//
//mage.instantiateChaincode(param)
//    .then((result) => {
//        console.log('$$$$$$$$$$$$$$$$$$init success %s',JSON.stringify(result));
//        return true;
//    }).catch((err) => {
//        console.log('+++++++++++++++++++init failed %s',JSON.stringify(err));
//        return false;
//    });

var params={"type":1,"chaincode":{"name":"supplychain","version":"v0"},"ctorMsg":{"functionName":"queryTrade","args":["Sku", "TradeDate", "TraceInfo"]}};
params =JSON.stringify(params) ;

    request({
            //method: 'GET',
            //uri : "http://localhost:8081/v1/supplychain?rpctime=2017-04-17 10:00:00&params="+params+"&id=2"
            method: 'post',
            uri : "http://localhost:8081/v1/supplychain",
            json :
            {
                "rpctime": "2017-04-17 10:00:00",
                "params": {
                    "type": 1,
                    "chaincode":{
                        "name":"trace",
                        "version":"v0"
                    },
                    "ctorMsg": {
                        "functionName":"iPostSkuBaseInfo",
                        "args":["skuId123", "vendortest", "traceCode123456", "hashabcd", "name123", "num123", "ext123", "sign123", "time123"]
                    }
                },
                "id": "2"
            }

        }, function(err,res,body){
            console.log(JSON.stringify(err))
            console.log(JSON.stringify(body))
        }
    )