# Base Image
FROM ubuntu:18.04

LABEL maintainer="Scott Christley <scott.christley@utsouthwestern.edu>"

# Install OS Dependencies
RUN DEBIAN_FRONTEND='noninteractive' apt-get update && DEBIAN_FRONTEND='noninteractive' apt-get install -y \
    make \
    wget \
    xz-utils \
    default-jre \
    git \
    python3 \
    python3-pip \
    python3-sphinx \
    python3-scipy \
    libyaml-dev \
    unzip

RUN pip3 install \
    pandas \
    biopython \
    airr \
    python-dotenv

# node
RUN wget https://nodejs.org/dist/v8.10.0/node-v8.10.0-linux-x64.tar.xz
RUN tar xf node-v8.10.0-linux-x64.tar.xz
RUN cp -rf /node-v8.10.0-linux-x64/bin/* /usr/local/bin
RUN cp -rf /node-v8.10.0-linux-x64/lib/* /usr/local/lib
RUN cp -rf /node-v8.10.0-linux-x64/include/* /usr/local/include
RUN cp -rf /node-v8.10.0-linux-x64/share/* /usr/local/share

RUN npm install -g swagger

RUN mkdir /adc-api-js-mongodb
RUN mkdir /adc-api-js-mongodb/app

# Install npm dependencies (optimized for cache)
COPY app/package.json /adc-api-js-mongodb/app
RUN cd /adc-api-js-mongodb/app && npm install

# pull in sway bug fix for array parameters
RUN cd /adc-api-js-mongodb/app && npm install https://github.com/apigee-127/sway.git#94ba34f --save

# Copy project source
COPY . /adc-api-js-mongodb

# Copy AIRR spec
RUN cp /adc-api-js-mongodb/airr-standards/specs/adc-api.yaml /adc-api-js-mongodb/app/api/swagger/adc-api.yaml
RUN cp /adc-api-js-mongodb/airr-standards/specs/airr-schema.yaml /adc-api-js-mongodb/app/config/airr-schema.yaml

CMD ["node", "--harmony", "/adc-api-js-mongodb/app/app.js"]
