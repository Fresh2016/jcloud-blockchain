# Start with Ubuntu 16.04 64bit
FROM gcc:4.9.4

MAINTAINER Ying <s015348@aliyun.com>

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 6.9.5

# Prepare tools
RUN apt-get update && \
    apt-get install -y apt-utils && \
    apt-get install -y curl wget xz-utils bzip2 git vim && \
    apt-get install -y python python-dev

################ Install nodejs ################
# Install nodejs and npm
RUN cd / && \
	curl -sL https://deb.nodesource.com/setup_6.x | bash && \
	apt-get install nodejs && \
	node -v && npm -v
#    ln -s /usr/local/bin/node /usr/local/bin/nodejs

################ Install jcloud-blockchain ################
# Install jcloud-blockchain
RUN cd / && \
    git clone http://103.237.5.178:3000/shiying/jcloud-blockchain /jcloud-blockchain && \
    cd /jcloud-blockchain && \
    npm install -g gulp && \
    npm install -g grpc && \
	npm install -g node-gyp && \
    npm install -g hashtable && \
    npm install

# Replace node_modules with latest codes
COPY docker-buile-packages/fabric-client /jcloud-blockchain/node_modules/fabric-client
COPY docker-buile-packages/fabric-ca-client /jcloud-blockchain/node_modules/fabric-ca-client

# Default server port
EXPOSE 8081

# Set workdir
WORKDIR /jcloud-blockchain

# Run server
CMD node server.js

# Docker commands
#docker build -t shiying/jcloud-blockchain:1.4 -f Dockerfile .
#docker build --no-cache=true -t shiying/jcloud-blockchain:1.4 -f Dockerfile .
#docker login --username=shiying
#docker push shiying/jcloud-blockchain:1.4
#docker run -it -p 8081:8081 shiying/jcloud-blockchain:1.4
#docker rm -f $(docker ps -a -q)
#docker rm -f $(docker ps -a | grep none | awk '{print $1 }')
#docker images|grep none|awk '{print $3 }'|xargs docker rmi