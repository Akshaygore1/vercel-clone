# Lightweight Ubuntu-based container with fnm for Node.js builds
# Using Ubuntu instead of Alpine because Node.js binaries from fnm are compiled for glibc
FROM ubuntu:22.04

# Install required dependencies
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set up fnm environment
ENV FNM_DIR=/root/.fnm
ENV PATH="${FNM_DIR}:${PATH}"

# Install fnm from GitHub releases
RUN curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir "${FNM_DIR}" --skip-shell

# Create working directory
WORKDIR /app

# Copy build script and upload script
COPY build.sh /usr/local/bin/build.sh
RUN chmod +x /usr/local/bin/build.sh

# Copy upload script and package.json for R2 upload
COPY upload-to-r2.js /usr/local/bin/upload-to-r2.js
COPY package.json /usr/local/bin/package.json
RUN chmod +x /usr/local/bin/upload-to-r2.js

# Environment variables with defaults
ENV NODE_VERSION="lts/latest"
ENV BRANCH="main"
ENV BUILD_CMD="npm run build"
# REPO_URL is required and has no default

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/build.sh"]

