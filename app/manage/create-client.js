createClient = require('../client/create-channel.js');
joinClient = require('../client/join-channel.js');
installClient = require('../client/install-chaincode.js');
invokeClient = require('../client/invoke-transaction.js');
queryClient = require('../client/query.js');

var ClientUtils = require('fabric-client/lib/utils.js');
var logger = ClientUtils.getLogger('join-channel');

/**
 * 创建Channel
 * @returns {Promise.<T>|*|Observable}
 */

function createChannel(channelName){
    return  queryClient.queryOrderers(channelName)
        .then((result) => {
             //if(result[0]['status'] == 'UP'){
                 return  new Promise((resolve, reject) => resolve(true));
             //}else{
             //    var err ={msg:"status not is up"}
             //    util.throwError(logger, err, channelName+'status not is up');
             //}

        }).catch((err) => {
             return createClient.createChannel();
        });
}
/**
 *  join Channel
 * @returns {Promise.<T>|*|Observable}
 */

function joinChannel(channelName){
    return   queryClient.queryPeers(channelName)
        .then((result) => {
            //if(result[0]['status'] == 'UP'){
            return  new Promise((resolve, reject) => resolve(true));
            //}else{
            //    var err ={msg:"status not is up"}
            //    util.throwError(logger, err, channelName+'status not is up');
            //}

        }).catch((err) => {
            return  joinClient.joinChannel();
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







exports.create =function(channelName){
  return   createChannel(channelName)
        .then((response) => {
            console.log('createChannel: %j\n\n\n', response);
            return joinChannel(channelName);

        }).then((response) => {
            console.log('joinChannel: %j\n\n\n', response);
            return  installChaincode();
        }).then((response) => {
          console.log('installChaincode: %j\n\n\n', response);
          return  instantiateChaincode();
        }).then((response) => {
          console.log('qinstantiateChaincode: %j\n\n\n', response);
          return  new Promise((resolve, reject) => resolve("Create success"));
        }).catch((err) => {
            return  new Promise((resolve, reject) => resolve("Create failed"));
        });
}
