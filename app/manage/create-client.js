createClient = require('../client/create-channel.js');
joinClient = require('../client/join-channel.js');
installClient = require('../client/install-chaincode.js');
invokeClient = require('../client/invoke-transaction.js');
queryClient = require('../client/query.js');





function createChannel(){
    return  createClient.createChannel()
        .then((result) => {
            console.log('API: create channel result %s', JSON.stringify(result));
            return joinClient.joinChannel();
        }).then((result) => {
             //console.log('shiying is aaaa.');
             return  new Promise((resolve, reject) => resolve(true));
        }).catch((err) => {
            console.log('Return without executing joining');
             return  new Promise((resolve, reject) => resolve(false));
        });
}



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
                return   createChannel()
                    .then((result) => {
                        console.log('******************************'+result);
                        if(result){
                            return  new Promise((resolve, reject) => resolve("创建成功"));
                        }else{
                            return  new Promise((resolve, reject) => resolve("创建失败"));
                        }

                    }).catch((err) => {
                        return  new Promise((resolve, reject) => resolve("创建失败"));
                    });
            }else{
                console.log('已经被创建');
                return  new Promise((resolve, reject) => resolve("已经被创建"));
            }

        })
}
