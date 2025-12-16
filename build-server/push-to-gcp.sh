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
GCP_PROJECT_ID="${GCP_PROJECT_ID:-}"
GCP_REGION="${GCP_REGION:-us-central1}"
REPOSITORY_NAME="${REPOSITORY_NAME:-docker-repo}"
IMAGE_NAME="${IMAGE_NAME:-build-server}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI is not installed."
    log_info "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if GCP_PROJECT_ID is set
if [ -z "$GCP_PROJECT_ID" ]; then
    log_error "GCP_PROJECT_ID environment variable is required"
    log_info "Usage: GCP_PROJECT_ID=your-project-id ./push-to-gcp.sh"
    log_info "Optional variables:"
    log_info "  GCP_REGION (default: us-central1)"
    log_info "  REPOSITORY_NAME (default: docker-repo)"
    log_info "  IMAGE_NAME (default: build-server)"
    log_info "  IMAGE_TAG (default: latest)"
    exit 1
fi

# Authenticate with GCP
log_info "Checking GCP authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    log_warn "Not authenticated with GCP. Attempting to login..."
    if ! gcloud auth login; then
        log_error "GCP authentication failed. Please run 'gcloud auth login' and try again."
        exit 1
    fi
fi

# Configure Docker to use gcloud as credential helper
log_info "Configuring Docker credential helper for GCP..."
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

# Full image name for GCP Artifact Registry
# Format: REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY_NAME/IMAGE_NAME:TAG
FULL_IMAGE_NAME="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPOSITORY_NAME}/${IMAGE_NAME}:${IMAGE_TAG}"

# Platform to build for (linux/amd64 for x86_64 compatibility)
PLATFORM="${PLATFORM:-linux/amd64}"

log_info "Building Docker image: ${FULL_IMAGE_NAME}"
log_info "Platform: ${PLATFORM}"
log_info "Project: ${GCP_PROJECT_ID}"
log_info "Region: ${GCP_REGION}"
log_info "Repository: ${REPOSITORY_NAME}"

# Check if repository exists, create if it doesn't
log_info "Checking if repository exists..."
if ! gcloud artifacts repositories describe "${REPOSITORY_NAME}" \
    --location="${GCP_REGION}" \
    --project="${GCP_PROJECT_ID}" \
    --format="value(name)" &> /dev/null; then
    log_warn "Repository '${REPOSITORY_NAME}' does not exist. Creating it..."
    if ! gcloud artifacts repositories create "${REPOSITORY_NAME}" \
        --repository-format=docker \
        --location="${GCP_REGION}" \
        --project="${GCP_PROJECT_ID}" \
        --description="Docker repository for build-server"; then
        log_error "Failed to create repository. Please check your permissions."
        exit 1
    fi
    log_success "Repository created successfully"
else
    log_info "Repository exists"
fi

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
    log_info "To pull this image:"
    log_info "  docker pull ${FULL_IMAGE_NAME}"
    log_info ""
    log_info "To use in Kubernetes/GKE:"
    log_info "  image: ${FULL_IMAGE_NAME}"
else
    log_error "Image build/push failed"
    log_info "Make sure you have the necessary GCP permissions:"
    log_info "  - Artifact Registry Writer role"
    log_info "  - Or run: gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev"
    exit 1
fi

