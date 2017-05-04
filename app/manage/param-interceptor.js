/**
 * 参数过滤器
 * @param req
 */
exports.filterParams =function(req,res){
    if(null!=req.params && null!=req.params.channelname && ""!=req.params.channelname){
        req.query.params['channelName'] = req.params.channelname;
    }

}

