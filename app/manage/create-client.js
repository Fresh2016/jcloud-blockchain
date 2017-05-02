createClient = require('../client/create-channel.js');
joinClient = require('../client/join-channel.js');
installClient = require('../client/install-chaincode.js');
invokeClient = require('../client/invoke-transaction.js');
queryClient = require('../client/query.js');

var ClientUtils = require('fabric-client/lib/utils.js');
var logger = ClientUtils.getLogger('create-manage');

/**
 * create Channel
 * @returns {Promise.<T>|*|Observable}
 */

function createChannel(channelName){
    return  queryClient.queryOrderers(channelName)
        .then((result) => {
            logger.debug('createChannel: Already create');
             //if(result[0]['status'] == 'UP'){
                 return  new Promise((resolve, reject) => resolve("Already create"));
             //}else{
             //    var err ={msg:"status not is up"}
             //    util.throwError(logger, err, channelName+'status not is up');
             //}

        }).catch((err) => {
             return createClient.createChannel();
        });
}
//exports.createChannel =createChannel;
/**
 *  join Channel
 * @returns {Promise.<T>|*|Observable}
 */

function joinChannel(channelName){
    return   queryClient.queryPeers(channelName)
        .then((result) => {
            //if(result[0]['status'] == 'UP'){
            logger.debug('createChannel: Already join');
            return  new Promise((resolve, reject) => resolve("Already join"));
            //}else{
            //    var err ={msg:"status not is up"}
            //    util.throwError(logger, err, channelName+'status not is up');
            //}

        }).catch((err) => {
            return  joinClient.joinChannel();
        });
}
//exports.joinChannel =joinChannel;

/**
 * installChaincode
 * @returns {Promise.<T>|*|Observable}
 */
function installChaincode(){
    return  installClient.installChaincode()
        .catch((err) => {
            err.errName="installChaincodeError";
            logger.debug(' install failed %s',JSON.stringify(err));
            //如果失败报错，也继续执行下一个方法instantiate
            return new Promise((resolve, reject) => resolve(err));
        });
}
//exports.installChaincode =installChaincode;
/**
 *  instantiateChaincode
 * @returns {Promise.<T>|*|Observable}
 */
function instantiateChaincode(){
    return  invokeClient.instantiateChaincode()
        .catch((err) => {
            err.errName="installChaincodeError";
            logger.debug('instantiate failed %s',JSON.stringify(err));
            return new Promise((resolve, reject) => reject(err));
        });
}
//exports.instantiateChaincode =instantiateChaincode;


/**
 * create mangage
 * @param channelName
 * @returns {Promise.<T>|*}
 */

function create(channelName){
  return   createChannel(channelName)
        .then((response) => {
            logger.debug('createChannel: %j\n\n\n', response);
            return joinChannel(channelName);

        }).then((response) => {
            logger.debug('joinChannel: %j\n\n\n', response);
            return  installChaincode();
        }).then((response) => {
          logger.debug('installChaincode: %j\n\n\n', response);
          return  instantiateChaincode();
        }).then((response) => {
          logger.debug('instantiateChaincode: %j\n\n\n', response);
          return  new Promise((resolve, reject) => resolve("Create success"));
        }).catch((err) => {
            logger.debug('Create failed %s',JSON.stringify(err));
            return  new Promise((resolve, reject) => reject("Create failed"));
        });
}
exports.create =create;

/**
 * init
 * @param channelName
 */
exports.initCreate =function(){
    return  create('mychannel')
        .then((result) => {
            logger.debug('init success %s',JSON.stringify(result));
            return true;
        }).catch((err) => {
              logger.debug('init failed %s',JSON.stringify(err));
            return false;
        });
}