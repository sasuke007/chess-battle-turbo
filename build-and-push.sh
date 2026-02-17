#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Loading environment variables from apps/web/.env${NC}"

# Load environment variables
set -a
source apps/web/.env
set +a

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then
  echo -e "${RED}Error: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set${NC}"
  exit 1
fi

echo -e "${GREEN}Environment variables loaded successfully${NC}"
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:0:20}..."

# Get Docker Hub username
read -p "Enter your Docker Hub username: " DOCKER_USERNAME

# Ensure buildx builder exists
echo -e "${YELLOW}Setting up Docker buildx...${NC}"
if ! docker buildx inspect multiarch-builder > /dev/null 2>&1; then
  echo -e "${YELLOW}Creating buildx builder...${NC}"
  docker buildx create --name multiarch-builder --use
  docker buildx inspect --bootstrap
else
  docker buildx use multiarch-builder
fi

# Build the image for linux/amd64 (required for DigitalOcean/cloud providers)
echo -e "${YELLOW}Building Docker image for linux/amd64...${NC}"
docker buildx build \
  --platform linux/amd64 \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_URL="$NEXT_PUBLIC_CLERK_SIGN_IN_URL" \
  --build-arg CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  --build-arg NEXT_PUBLIC_WEBSOCKET_URL="$NEXT_PUBLIC_WEBSOCKET_URL" \
  -t ${DOCKER_USERNAME}/replay-chess-web:latest \
  -f apps/web/Dockerfile \
  --push \
  .

echo -e "${GREEN}Build and push completed successfully!${NC}"
echo -e "${GREEN}Image: ${DOCKER_USERNAME}/replay-chess-web:latest${NC}"
