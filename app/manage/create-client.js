createClient = require('../client/create-channel.js');
joinClient = require('../client/join-channel.js');
installClient = require('../client/install-chaincode.js');
invokeClient = require('../client/invoke-transaction.js');
queryClient = require('../client/query.js');


exports.create =function(){
  queryChannel('mychannel')
    .then((result) => {
          if(!result){
              createChannel()
                  .catch((err) => {
                      console.log('.........');
                      return false;
                  });
          }else{
              console.log('已经被创建');
          }

    })
}



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


exports.queryChannel = queryChannel();
function queryChannel(str){
    return   queryClient.queryPeers(str)
        .then((response) => {
            console.log('queryPeers response: %j\n\n\n', response);
            return queryClient.queryOrderers(str);

        }).then((response) => {
            console.log('queryOrderers response: %j\n\n\n', response);
            //console.log('### shiying is aaa ###');
            return  new Promise((resolve, reject) => resolve(true));

        }).catch((err) => {
            console.log('Return without querying.');
            return  new Promise((resolve, reject) => resolve(false));
        });
}

