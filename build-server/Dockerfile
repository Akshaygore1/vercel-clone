FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    bash \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://fnm.vercel.app/install | bash

ENV PATH=/root/.fnm:$PATH

WORKDIR /builder

COPY build.sh .
COPY package.json .
COPY upload-to-r2.js .
RUN chmod +x build.sh

ENTRYPOINT ["./build.sh"]
