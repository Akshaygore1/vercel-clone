#!/bin/bash
set -e

# Function to upload files to Cloudflare R2
upload_to_r2() {
    if [ -n "$R2_ACCOUNT_ID" ] && [ -n "$R2_ACCESS_KEY_ID" ] && [ -n "$R2_SECRET_ACCESS_KEY" ] && [ -n "$R2_BUCKET_NAME" ] && [ -n "$R2_ENDPOINT" ]; then
        echo "Uploading files to Cloudflare R2..."
        
        # Install npm dependencies for upload-to-r2.js
        cd /builder
        npm install
        
        # Run the upload script
        node upload-to-r2.js /workspace
        echo "Upload to R2 completed successfully!"
    else
        echo "R2 environment variables not set, skipping upload to R2"
    fi
}

# Check required environment variables
if [ -z "$REPO_URL" ]; then
    echo "Error: REPO_URL environment variable is required"
    exit 1
fi

# Clone repository
git clone $REPO_URL clone
cd clone

# Set up FNM path and environment
FNM_PATH="/root/.local/share/fnm"
if [ -d "$FNM_PATH" ]; then
  export PATH="$FNM_PATH:$PATH"
  eval "`fnm env --shell bash`"
fi

# Install Node.js version
fnm install "$NODE_VERSION"
fnm use "$NODE_VERSION"

# Check if this is a Node.js project
if [ ! -f "package.json" ]; then
    echo "No package.json found, treating as static repository"
    rm -rf /workspace
    mkdir -p /workspace
    cp -r . /workspace
    # Upload to Cloudflare R2
    upload_to_r2
    
    exit 0
fi

# Download the dependencies
if [ -f yarn.lock ]; then yarn install; \
elif [ -f package-lock.json ]; then npm install; \
elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
elif [ -f bun.lockb ]; then npm install -g bun && bun install; \
else echo "Lockfile not found." && exit 1; \
fi

# Build the project
if [ -f yarn.lock ]; then
  # Check if build script exists for yarn
  if grep -q "\"build\":" package.json; then
    echo "Running yarn build"
    yarn build
  else
    NO_BUILD=true
    echo "No build script found in package.json, skipping build step"
  fi
elif [ -f package-lock.json ]; then
  # Check if build script exists for npm
  if grep -q "\"build\":" package.json; then
    echo "Running npm run build"
    npm run build
  else
    NO_BUILD=true   
    echo "No build script found in package.json, skipping build step"
  fi
elif [ -f pnpm-lock.yaml ]; then
  # Check if build script exists for pnpm
  if grep -q "\"build\":" package.json; then
    echo "Running pnpm run build"
    pnpm run build
  else
    NO_BUILD=true
    echo "No build script found in package.json, skipping build step"
  fi
elif [ -f bun.lockb ]; then
  # Check if build script exists for bun
  if grep -q "\"build\":" package.json; then
    echo "Running bun run build"
    bun run build
  else
    NO_BUILD=true
    echo "No build script found in package.json, skipping build step"
  fi
else
  NO_BUILD=true
  echo "Lockfile not found."
fi

# Clean workspace and prepare output
rm -rf /workspace
rm -rf node_modules .git
mkdir -p /workspace

# Copy build output
if [ -d "dist" ]; then
    cp -r dist/* /workspace/ 2>/dev/null || cp -r dist/. /workspace/
elif [ -d "build" ]; then
    cp -r build/* /workspace/ 2>/dev/null || cp -r build/. /workspace/
elif [ -d "out" ]; then
    cp -r out/* /workspace/ 2>/dev/null || cp -r out/. /workspace/
elif [ -d "public" ]; then
    cp -r public/* /workspace/ 2>/dev/null || cp -r public/. /workspace/
else
    cp -r . /workspace
fi

# Upload to Cloudflare R2
upload_to_r2


