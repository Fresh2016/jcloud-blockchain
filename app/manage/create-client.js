createClient = require('../client/create-channel.js');
joinClient = require('../client/join-channel.js');
installClient = require('../client/install-chaincode.js');
invokeClient = require('../client/invoke-transaction.js');
queryClient = require('../client/query.js');


/**
 * 创建Channel
 * @returns {Promise.<T>|*|Observable}
 */

function createChannel(){
    return  createClient.createChannel()
        .then((result) => {
             return  new Promise((resolve, reject) => resolve(true));
        }).catch((err) => {
            err.errName="createChannelError";
            return new Promise((resolve, reject) => reject(err));
        });
}
/**
 *  join Channel
 * @returns {Promise.<T>|*|Observable}
 */
function joinChannel(){
    return  joinClient.joinChannel()
        .catch((err) => {
            err.errName="joinChannelError";
            return new Promise((resolve, reject) => reject(err));
        });
}

/**
 * installChaincode
 * @returns {Promise.<T>|*|Observable}
 */
function installChaincode(){
    return  installClient.installChaincode()
        .catch((err) => {
            err.errName="installChaincodeError";
            return new Promise((resolve, reject) => reject(err));
        });
}

/**
 *  instantiateChaincode
 * @returns {Promise.<T>|*|Observable}
 */
function instantiateChaincode(){
    return  invokeClient.instantiateChaincode()
        .catch((err) => {
            err.errName="installChaincodeError";
            return new Promise((resolve, reject) => reject(err));
        });
}


/**
 * create, join, install, instantiate
 */
function createChannelManage(){
    createClient.createChannel()
        .then((result) => {
            console.log('API: create channel result %s', JSON.stringify(result));
            return joinChannel();
        }) .then((result) => {
            console.log('API: join channel result %s', JSON.stringify(result));
            return installChaincode();

        }) .then((result) => {
            console.log('API: install channel result %s', JSON.stringify(result));
            return instantiateChaincode();

        }).then((result) => {
            console.log('API: instantiate channel result %s', JSON.stringify(result));

            return  new Promise((resolve, reject) => resolve(true));
        }).catch((err) => {
            console.log('createChannelManage channel result %s', JSON.stringify(err));
            return  new Promise((resolve, reject) => resolve(false));
        });
}


/**
 * 查询 Channel
 * @param channelName
 * @returns {Promise.<T>|*|Observable}
 */
function queryChannel(channelName){
    return   queryClient.queryPeers(channelName)
        .then((response) => {
            console.log('queryPeers response: %j\n\n\n', response);
            return queryClient.queryOrderers(channelName);

        }).then((response) => {
            console.log('queryOrderers response: %j\n\n\n', response);
            //console.log('### shiying is aaa ###');
            return  new Promise((resolve, reject) => resolve(true));

        }).catch((err) => {
            console.log('Return without querying.');
            return  new Promise((resolve, reject) => resolve(false));
        });
}



exports.create =function(channelName){
    return queryChannel(channelName)
        .then((result) => {
            if(!result){
                return   createChannelManage()
                    .then((result) => {
                        if(result){
                            return  new Promise((resolve, reject) => resolve("Create success"));
                        }else{
                            return  new Promise((resolve, reject) => resolve("Create failed"));
                        }

                    }).catch((err) => {
                        return  new Promise((resolve, reject) => resolve("Create failed"));
                    });
            }else{
                console.log('Already exist');
                return  new Promise((resolve, reject) => resolve("Already exist"));
            }

        }).catch((err) => {
            return  new Promise((resolve, reject) => resolve("Create failed"));
        });
}
