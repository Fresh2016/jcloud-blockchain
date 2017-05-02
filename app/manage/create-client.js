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
            console.log('createChannel: 已经被创建');
             //if(result[0]['status'] == 'UP'){
                 return  new Promise((resolve, reject) => resolve("已经被创建"));
             //}else{
             //    var err ={msg:"status not is up"}
             //    util.throwError(logger, err, channelName+'status not is up');
             //}

        }).catch((err) => {
             return createClient.createChannel();
        });
}
exports.createChannel =createChannel;
/**
 *  join Channel
 * @returns {Promise.<T>|*|Observable}
 */

function joinChannel(channelName){
    return   queryClient.queryPeers(channelName)
        .then((result) => {
            //if(result[0]['status'] == 'UP'){
            console.log('createChannel: 已经被join');
            return  new Promise((resolve, reject) => resolve("已经被join"));
            //}else{
            //    var err ={msg:"status not is up"}
            //    util.throwError(logger, err, channelName+'status not is up');
            //}

        }).catch((err) => {
            return  joinClient.joinChannel();
        });
}
exports.joinChannel =joinChannel;

/**
 * installChaincode
 * @returns {Promise.<T>|*|Observable}
 */
function installChaincode(){
    return  installClient.installChaincode()
        .catch((err) => {
            err.errName="installChaincodeError";
            console.log('installChaincode: install失败 %s',JSON.stringify(err));
            //如果失败报错，也继续执行下一个方法instantiate
            return new Promise((resolve, reject) => resolve(err));
        });
}
exports.installChaincode =installChaincode;
/**
 *  instantiateChaincode
 * @returns {Promise.<T>|*|Observable}
 */
function instantiateChaincode(){
    return  invokeClient.instantiateChaincode()
        .catch((err) => {
            err.errName="installChaincodeError";
            console.log('instantiateChaincode: instantiate失败 %s',JSON.stringify(err));
            return new Promise((resolve, reject) => reject(err));
        });
}
exports.instantiateChaincode =instantiateChaincode;






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
          console.log('instantiateChaincode: %j\n\n\n', response);
          return  new Promise((resolve, reject) => resolve("Create success"));
        }).catch((err) => {
            console.log('Create failed %s',JSON.stringify(err));
            return  new Promise((resolve, reject) => reject("Create failed"));
        });
}
