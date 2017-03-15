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
# Keys for node
# gpg keys listed at https://github.com/nodejs/node
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    56730D5401028683275BD23C23EFEFE93C4CFFFE \
  ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
  done

# Install nodejs and npm
RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" && \
    curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" && \
    gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc && \
    grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - && \
    tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 && \
    rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt && \
    ln -s /usr/local/bin/node /usr/local/bin/nodejs

################ Install jcloud-blockchain ################
# Install jcloud-blockchain
RUN cd / && \
    git clone https://github.com/s015348/bc-client /jcloud-blockchain && \
    cd /jcloud-blockchain && \
    npm -g install grpc && \
	npm install -g node-gyp && \
    npm install -g hashtable && \
    npm install

# Replace node_modules with latest codes
RUN git clone https://github.com/hyperledger/fabric-sdk-node ./temp && \
    rm -rf node_modules/fabric-client/ && \
    rm -rf node_modules/fabric-ca-client/ && \
    cp -r ./temp/fabric-client/ node_modules/ && \
    cp -r ./temp/fabric-ca-client/ node_modules/ && \
    rm -rf ./temp

WORKDIR /jcloud-blockchain


# Docker commands
#docker build -t shiying/jcloud-blockchain:1.0 -f Dockerfile .
#docker login --username=shiying
#docker push shiying/jcloud-blockchain:1.0
#docker run -it shiying/jcloud-blockchain:1.0 bash
#docker rm -f $(docker ps -a -q)
#docker images|grep none|awk '{print $3 }'|xargs docker rmi