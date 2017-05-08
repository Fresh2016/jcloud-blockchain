var channel={
     list:["mychannel"],
     mychannel:{
         chainCode:{
             supplychain: {
                 name:"supplychain",
                 version:"v0",
                 path:"github.com/supplychain",
                 peerList:["peer0","peer2"]

              },
             trace: {
                 name:"trace",
                 version:"v0",
                 path:"github.com/trace",
                 peerList:["peer1","peer3"]

             },
             sourceproduct:{
                 name:"sourceproduct",
                 version:"v0",
                 path:"github.com/sourceproduct",
                 peerList:["peer0","peer1","peer2","peer3"]

             }
         },
         txFilePath:"./app/manage/data/mychannel.tx",
         version:"v0"
     }
}



//module.exports = function(mode) {
//    return channel[mode];
//};


exports.getConfig= function(mode) {
    if(mode){
        return channel[mode];
    }
    return channel;
}