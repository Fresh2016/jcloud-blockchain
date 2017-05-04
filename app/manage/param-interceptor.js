var ClientUtils = require('fabric-client/lib/utils.js');
var config =require('../config/channel/channel.js');
var logger = ClientUtils.getLogger('param-interceptor');
var rf=require("fs");
// Fabric client imports
var hfc = require('fabric-client');
hfc.addConfigFile('./app/channel/network.json');

/**
 * Parameter filter
 * @param req
 */
exports.filterParams =function(req,res){
    if(req.params){
        if( null!=req.params.channelname && ""!=req.params.channelname){
            req.query.params['channelName'] = req.params.channelname;

            setNetwork(req,res);
            setChaincodePath(req,res);
            setTxFileData(req,res);
        }
    }else{
        req.params ={};
    }

}
/**
 * 校验是否存在channelName
 * @param req
 */
function vifchannelName(req){
  var channelName=req.query.params['channelName'];
}

/**
 * 设置txfile的data
 * @param req
 */
function setTxFileData(req,res){
    try{
        var  txFilePath =config[req.query.params['channelName']].txFilePath;
        var data=rf.readFileSync("txFilePath","utf-8");
        req.params.txFileData = data;
    }catch(err) {
        logger.error('setTxFileData error');
    }
}


/**
 * 设置Chaincode的Path
 * @param req
 */
function setChaincodePath(req,res){
    try{
        var  chaincodePath =config[req.query.params['channelName']]['chanCode'][req.query.params.chaincode.name].path;
        req.params.chaincode.path = chaincodePath;
    }catch(err) {
        logger.error('setChaincodePath error');
    }
}
/**
 * 设置network
 * @param req
 * @param res
 */
function setNetwork(req,res){
    try{
        var  peerList =config[req.query.params['channelName']]['chanCode'][req.query.params.chaincode.name].peerList;
        req.params.network = {};
        req.params.network.orderer = hfc.getConfigSetting('orderer');
        for(var i =0;i<peerList.length;i++){
           var peer =  hfc.getConfigSetting(peerList[i]);
            if(req.params.network[peer.assign]){
                req.params.network[peer.assign]["num"] = req.params.network[peer.assign]["num"] +1;
                var peerNum = "peer" +req.params.network[peer.assign]["num"];
                req.params.network[peer.assign][peerNum] = peer;
            } else{
                req.params.network[peer.assign] = hfc.getConfigSetting(peer.assign);
                req.params.network[peer.assign]["peer1"] = peer;
                req.params.network[peer.assign]["num"] =1;
            }
        }
    }catch(err) {
        logger.error('setNetwork error');
    }
}