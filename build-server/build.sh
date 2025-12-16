#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
if [ -z "$REPO_URL" ]; then
    log_error "REPO_URL environment variable is required"
    exit 1
fi

# Set defaults
NODE_VERSION="${NODE_VERSION:-lts/latest}"
BRANCH="${BRANCH:-main}"
BUILD_CMD="${BUILD_CMD:-npm run build}"

log_info "Starting build process..."
log_info "Repository: $REPO_URL"
log_info "Branch: $BRANCH"
log_info "Node Version: $NODE_VERSION"
log_info "Build Command: $BUILD_CMD"

# ============================================
# Step 1: Initialize fnm
# ============================================
log_info "Initializing fnm..."
export FNM_DIR="/root/.fnm"
export PATH="${FNM_DIR}:${PATH}"
eval "$(fnm env --shell bash)"

# ============================================
# Step 2: Install Node.js version
# ============================================
log_info "Installing Node.js version: $NODE_VERSION"
fnm install "$NODE_VERSION"
fnm use "$NODE_VERSION"

log_success "Node.js $(node --version) installed"
log_info "npm version: $(npm --version)"

# ============================================
# Step 3: Clone repository
# ============================================
log_info "Cloning repository..."
REPO_DIR="/app/repo"
rm -rf "$REPO_DIR"
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
cd "$REPO_DIR"

log_success "Repository cloned successfully"

# ============================================
# Step 4: Install dependencies
# ============================================
log_info "Installing dependencies..."

if [ -f "package-lock.json" ]; then
    npm ci
elif [ -f "yarn.lock" ]; then
    npm install -g yarn
    yarn install --frozen-lockfile
elif [ -f "pnpm-lock.yaml" ]; then
    npm install -g pnpm
    pnpm install --frozen-lockfile
else
    npm install
fi

log_success "Dependencies installed"

# ============================================
# Step 5: Build the project
# ============================================
log_info "Running build command: $BUILD_CMD"
eval "$BUILD_CMD"

log_success "Build completed"

# ============================================
# Step 6: Upload to Cloudflare R2 (optional)
# ============================================
if [ -n "$R2_ACCOUNT_ID" ] && [ -n "$R2_ACCESS_KEY_ID" ] && [ -n "$R2_SECRET_ACCESS_KEY" ] && [ -n "$R2_BUCKET_NAME" ] && [ -n "$R2_ENDPOINT" ]; then
    log_info "R2 credentials detected, preparing upload..."
    
    # Install AWS SDK if not already installed
    if [ ! -d "node_modules/@aws-sdk" ]; then
        log_info "Installing AWS SDK for R2 upload..."
        npm install @aws-sdk/client-s3 --no-save
    fi
    
    # Find the output directory (common build output directories)
    OUTPUT_DIR=""
    for dir in dist build out public .next; do
        if [ -d "$dir" ]; then
            OUTPUT_DIR="$dir"
            break
        fi
    done
    
    if [ -z "$OUTPUT_DIR" ]; then
        log_warn "No standard output directory found (dist, build, out, public, .next)"
        log_warn "Skipping R2 upload"
    else
        log_info "Found output directory: $OUTPUT_DIR"
        log_info "Uploading to Cloudflare R2..."
        
        # Convert to absolute path and run the upload script
        # Set NODE_PATH to include the repo's node_modules so the script can find @aws-sdk/client-s3
        ABS_OUTPUT_DIR="$(cd "$OUTPUT_DIR" && pwd)"
        NODE_PATH="$REPO_DIR/node_modules:$NODE_PATH" node /usr/local/bin/upload-to-r2.js "$ABS_OUTPUT_DIR"
        
        if [ $? -eq 0 ]; then
            log_success "Upload to R2 completed"
        else
            log_error "Upload to R2 failed"
            exit 1
        fi
    fi
else
    log_info "R2 credentials not provided, skipping upload"
fi

log_success "Build process completed!"


