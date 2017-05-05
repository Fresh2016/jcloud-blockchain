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
    	setChannel(req,res);
    }
    
    var params = req.query.params || req.body.params;
    if(null!=params){
        if(typeof(params) !="object"){
            req.query.params =  JSON.parse(params);
        }

        req.query.params['channelName'] = req.params.channelname;
        // FIXME: errors in case of creating channel
//        setNetwork(req,res);
//        setChaincodePath(req,res);
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
 * 设置Channel的名字、版本和Tx文件
 * @param req
 */
function setChannel(req,res) {
	try{
        //todo 第二个参数必须是 Channelname ，如果不是，就需要调整
        var originalUrl = req.originalUrl;
        var originalList = originalUrl.split("/");
    	if (2 === originalList.length) {
    		logger.debug('Creating channel. About to set channel name and Tx file');
            setChannelName(req, res, req.query.params.channel.name);
            setTxFileData(req, res);

    	} else if (3 === originalList.length) {
    		logger.debug('Operating channel %s. About to set channel name in params', originalList[2]);
            setChannelName(req, res, originalList[2]);

    	} else {
    		throw new Error('Original URL unrecognized');
    	}
		logger.debug('Channel set in params. Updated params: %j', req.query.params);

    } catch(err) {
        logger.error('setChannel error %s', JSON.stringify(err));
    }
}

/**
 * 设置Channel的名字
 * @param req
 */
function setChannelName(req, res, reqChannelname) {
   var channelList = config.list;

   if (channelList.indexOf(reqChannelname) <0) {
    	throw new Error("Config channelname not exist. Check content in ./data/network.js");
    } else {
    	if(isEmptyObject(req.params)) {
    		req.params = {
    				channelname : reqChannelname
    		};
    	} else {
    		req.params.channelname = reqChannelname;
    	}
		logger.debug('Channel name set in params. Updated channel: %j', req.query.params.channel);
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
        if(null==config[req.query.params.channelName]){

            return res.json("channelName is null")
        }
        if(null==config[req.query.params.channelName]['chainCode']){

            return res.json("chainCode is null")
        }
        if(null==config[req.query.params.channelName]['chainCode'][req.query.params.chaincode.name]){

            return res.json("chainCodeName is null")
        }
        var  peerList =config[req.query.params.channelName]['chainCode'][req.query.params.chaincode.name].peerList;
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
 * 设置txfile的data
 * @param req
 */
function setTxFileData(req,res){
	try{
		var txFilePath =config[req.params['channelname']].txFilePath;
		var data=rf.readFileSync(txFilePath,"utf-8");
		req.query.params.channel.txFileData = data;
		logger.debug('Tx file data set in params. Updated channel: %j', req.query.params.channel);
	} catch(err) {
		logger.error('setTxFileData error %s', JSON.stringify(err));
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
    return true;
}

//var req = { params: { channelname: 'mychannel' },
//    query:
//    { rpctime: '2017-04-17 10:00:00',
//        params: { type: 1,
//            channelName: 'mychannel',
//            chaincode : {
//            name : 'trace',
//            version : 'v0'
//        },
//            ctorMsg : {
//                functionName : 'iPostSkuBaseInfo',
//                args : ["skuId123", "vendortest", "traceCode123456", "hashabcd", "name123", "num123", "ext123", "sign123", "time123"]
//            } },
//        id: 2 } }
//
//setNetwork (req)

//console.log(req.query.params.channelName)
//console.log(config[req.query.params.channelName])
//console.log(config[req.query.params.channelName]['chainCode'])
//console.log(config[req.query.params.channelName]['chainCode'][req.query.params.chaincode.name])