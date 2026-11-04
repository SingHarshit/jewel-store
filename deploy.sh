#!/usr/bin/env bash
# ==============================================================================
# Heirest E-Commerce - Zero-Downtime EC2 Deployment Script
# Managed by GitHub Actions CI/CD Pipeline
# ==============================================================================
set -euo pipefail

echo "=========================================="
echo "  🚀 Starting Deployment on EC2"
echo "  Time: $(date -u '+%Y-%m-%d %H:%M:%SZ')"
echo "=========================================="

APP_DIR="${APP_DIR:-$(pwd)}"
cd "$APP_DIR"

# 1. Authenticate Docker with Amazon ECR
if [ -n "${ECR_REGISTRY:-}" ]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "📦 AWS CLI not detected. Installing awscli package..."
    sudo apt-get update -qq && sudo apt-get install -y -qq awscli || true
  fi

  if command -v aws >/dev/null 2>&1; then
    echo "🔐 Authenticating Docker with Amazon ECR (${ECR_REGISTRY})..."
    aws ecr get-login-password --region "${AWS_REGION:-ap-south-1}" | \
      docker login --username AWS --password-stdin "$ECR_REGISTRY"
  else
    echo "❌ Error: AWS CLI is required to authenticate with Amazon ECR."
    echo "   Please install it on EC2 using: sudo apt update && sudo apt install -y awscli"
    exit 1
  fi
fi

# 2. Persist image tags in .env if present
if [ -f .env ]; then
  if [ -n "${BACKEND_IMAGE:-}" ]; then
    if grep -q "^BACKEND_IMAGE=" .env; then
      sed -i "s|^BACKEND_IMAGE=.*|BACKEND_IMAGE=${BACKEND_IMAGE}|" .env
    else
      echo "BACKEND_IMAGE=${BACKEND_IMAGE}" >> .env
    fi
  fi
  if [ -n "${FRONTEND_IMAGE:-}" ]; then
    if grep -q "^FRONTEND_IMAGE=" .env; then
      sed -i "s|^FRONTEND_IMAGE=.*|FRONTEND_IMAGE=${FRONTEND_IMAGE}|" .env
    else
      echo "FRONTEND_IMAGE=${FRONTEND_IMAGE}" >> .env
    fi
  fi
fi

# 3. Pull latest backend & frontend images from ECR
if [ -n "${BACKEND_IMAGE:-}" ] && [[ "$BACKEND_IMAGE" == *"/"* ]]; then
  echo "📦 Pulling updated application container images from registry..."
  docker compose pull backend frontend
else
  echo "⚠️ Warning: BACKEND_IMAGE is not set to a remote registry URL ($BACKEND_IMAGE)."
  echo "   Building from source locally..."
  docker compose build backend frontend
fi

# 4. Deploy updated containers (leaving Postgres & Redis untouched)
echo "🔄 Recreating backend and frontend containers..."
docker compose up -d backend frontend

# 5. Post-deployment health check verification
echo "⏳ Verifying application health..."
MAX_ATTEMPTS=15
ATTEMPT=1
HEALTH_SUCCESS=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  if curl -sf http://127.0.0.1:5000/health > /dev/null 2>&1 || curl -sf http://127.0.0.1/api/v1/health > /dev/null 2>&1; then
    echo "✅ Health check passed on attempt ${ATTEMPT}/${MAX_ATTEMPTS}!"
    HEALTH_SUCCESS=1
    break
  fi
  echo "   Waiting for services to become healthy (Attempt ${ATTEMPT}/${MAX_ATTEMPTS})..."
  sleep 4
  ATTEMPT=$((ATTEMPT + 1))
done

if [ $HEALTH_SUCCESS -ne 1 ]; then
  echo "❌ CRITICAL: Application health check failed after ${MAX_ATTEMPTS} attempts!"
  echo "--- Backend Logs (Last 50 lines) ---"
  docker logs --tail 50 heirest_backend || true
  exit 1
fi

# 6. Clean up unused/dangling Docker images to preserve EC2 disk space
echo "🧹 Pruning old unused Docker images..."
docker image prune -f > /dev/null 2>&1 || true

echo "=========================================="
echo "  ✨ Deployment completed successfully!"
echo "=========================================="
