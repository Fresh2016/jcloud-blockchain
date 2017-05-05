var data={
  "orderer": {
    "url": "grpcs://202.77.131.6:7050",
    "server-hostname": "orderer0",
    "tls_cacerts": "./app/config/tls/orderer/ca-cert.pem"
  },
  "peer0": {
    "requests": "grpcs://202.77.131.6:7051",
    "events": "grpcs://202.77.131.6:7053",
    "server-hostname": "peer0",
    "tls_cacerts": "./app/config/tls/peers/peer0/ca-cert.pem",
    "isAnchor": "true",
    "assign":"org1"
  },
  "peer1": {
    "requests": "grpcs://202.77.131.6:7056",
    "events": "grpcs://202.77.131.6:7058",
    "server-hostname": "peer1",
    "tls_cacerts": "./app/config/tls/peers/peer1/ca-cert.pem",
    "isAnchor": "true",
    "assign":"org1"
  },
  "peer2": {
    "requests": "grpcs://202.77.131.6:8051",
    "events": "grpcs://202.77.131.6:8053",
    "server-hostname": "peer2",
    "tls_cacerts": "./app/config/tls/peers/peer2/ca-cert.pem",
    "isAnchor": "true",
    "assign":"org2"
  },
  "peer3": {
    "requests": "grpcs://202.77.131.6:8056",
    "events": "grpcs://202.77.131.6:8058",
    "server-hostname": "peer3",
    "tls_cacerts": "./app/config/tls/peers/peer3/ca-cert.pem",
    "isAnchor": "true",
    "assign":"org2"
  },


  "org1": {
    "name": "peerOrg1",
    "mspid": "Org1MSP",
    "ca": "https://202.77.131.6:7054"

  },
  "org2": {
    "name": "peerOrg2",
    "mspid": "Org2MSP",
    "ca": "https://202.77.131.6:8054"
  }
}

exports.getData= function(mode) {
  if(mode){
    return data[mode];
  }
  return data;
}