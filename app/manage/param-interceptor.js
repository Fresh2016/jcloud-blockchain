var ClientUtils = require('fabric-client/lib/utils.js');
var config =require('./data/channel.js').getConfig();
var network =require('./data/network.js').getData();
var logger = ClientUtils.getLogger('param-interceptor');
var rf=require("fs");


/**
 * Parameter filter
 * @param req
 */
exports.filterParams =function(req,res){
    if(isEmptyObject(req.params)){
        //todo 第二个参数必须是 Channelname ，如果不是，就需要调整
        var originalUrl = req.originalUrl;
        var originalList = originalUrl.split("/");
        var reqChannelname = originalList[2];
        var channelList = config.list;
        if(channelList.indexOf(reqChannelname) <0){
            return   res.json("channelname is not exist")
        }else{
            req.params.channelname = reqChannelname;
        }

    }
    var params = req.query.params || req.body.params;
    if(null!=params){
        req.query.params =  JSON.parse(params);
        req.query.params['channelName'] = req.params.channelname;
        setNetwork(req,res);
        setChaincodePath(req,res);
        setTxFileData(req,res);
    }else{
        req.query.params ={}
        req.query.params['channelName'] = req.params.channelname;
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
        var data=rf.readFileSync(txFilePath,"utf-8");
        req.params.txFileData = data;
    }catch(err) {
        logger.error('setTxFileData error %s',JSON.stringify(err));
    }
}


/**
 * 设置Chaincode的Path
 * @param req
 */
function setChaincodePath(req,res){
    try{
        var  chaincodePath =config[req.query.params['channelName']]['chainCode'][req.query.params.chaincode.name].path;
        req.query.params.chaincode.path = chaincodePath;
    }catch(err) {
        logger.error('setChaincodePath error %s',JSON.stringify(err));
    }
}
/**
 * 设置network
 * @param req
 * @param res
 */
function setNetwork(req,res){
    try{
        if(null!=config[req.query.params['channelName']]){
            return res.json("channelName is null")
        }
        if(null!=config[req.query.params['channelName']]['chainCode']){
            return res.json("chainCode is null")
        }
        if(null!=config[req.query.params['channelName']]['chainCode'][req.query.params.chaincode.name]){
            return res.json("chainCode is null")
        }
        var  peerList =config[req.query.params['channelName']]['chainCode'][req.query.params.chaincode.name].peerList;

        req.query.params.network = {};
        req.query.params.network.orderer = network.orderer;
        for(var i =0;i<peerList.length;i++){
           var peer =  network[peerList[i]];
            if(req.query.params.network[peer.assign]){
                req.query.params.network[peer.assign]["num"] = req.query.params.network[peer.assign]["num"] +1;
                var peerNum = "peer" +req.params.network[peer.assign]["num"];
                req.query.params.network[peer.assign][peerNum] = peer;
            } else{
                req.query.params.network[peer.assign] = network[peer.assign];
                req.query.params.network[peer.assign]["peer1"] = peer;
                req.query.params.network[peer.assign]["num"] =1;
            }
        }

    }catch(err) {
        logger.error('setNetwork error %s',JSON.stringify(err));
    }
}

/**
 * 是否空对象
 * @param e
 * @returns {boolean}
 */
function isEmptyObject(e) {
    for (var t in e)
        return false;
    return true
}

