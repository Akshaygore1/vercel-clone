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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-}"
IMAGE_NAME="${IMAGE_NAME:-build-server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if logged in to Docker Hub
log_info "Checking Docker Hub authentication..."
if ! docker info | grep -q "Username"; then
    log_warn "Not logged in to Docker Hub. Attempting to login..."
    if ! docker login; then
        log_error "Docker login failed. Please run 'docker login' and try again."
        exit 1
    fi
fi

# Check if DOCKER_USERNAME is set
if [ -z "$DOCKER_USERNAME" ]; then
    log_error "DOCKER_USERNAME environment variable is required"
    log_info "Usage: DOCKER_USERNAME=yourusername ./push-to-dockerhub.sh"
    log_info "Or set it in your environment: export DOCKER_USERNAME=yourusername"
    exit 1
fi

# Full image name
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

# Platform to build for (linux/amd64 for x86_64 compatibility)
PLATFORM="${PLATFORM:-linux/amd64}"

log_info "Building Docker image: ${FULL_IMAGE_NAME}"
log_info "Platform: ${PLATFORM}"

# Set up buildx builder if it doesn't exist
log_info "Setting up Docker buildx..."
docker buildx create --use --name multiarch-builder 2>/dev/null || docker buildx use multiarch-builder 2>/dev/null || true

# Build and push the image for the specified platform
log_info "Building and pushing image..."
docker buildx build \
    --platform "${PLATFORM}" \
    --tag "${FULL_IMAGE_NAME}" \
    --push \
    .

if [ $? -eq 0 ]; then
    log_success "Image built and pushed successfully!"
    log_info "Image: ${FULL_IMAGE_NAME}"
    log_info ""
    log_info "To make the image private:"
    log_info "1. Go to https://hub.docker.com/repository/docker/${DOCKER_USERNAME}/${IMAGE_NAME}"
    log_info "2. Click on 'Settings' or 'Repository Settings'"
    log_info "3. Change visibility from 'Public' to 'Private'"
else
    log_error "Image build/push failed"
    log_info "Make sure you're logged in: docker login"
    exit 1
fi

