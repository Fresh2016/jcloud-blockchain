var channel={
     list:["mychannel"],
     mychannel:{
         chanCode:{
             supplychain: {
                 name:"supplychain",
                 version:"v0",
                 path:"github.com/supplychain"

              },
             trace: {
                 name:"trace",
                 version:"v0",
                 path:"github.com/trace"

             },
             sourceproduct:{
                 name:"sourceproduct",
                 version:"v0",
                 path:"github.com/sourceproduct"

             }
         }
     }
}



module.exports = function(mode) {
    return channel[mode];
};
