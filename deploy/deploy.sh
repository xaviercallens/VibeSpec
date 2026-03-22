#!/usr/bin/env bash
# VibeSpec GCP Deployment Script
# Usage: ./deploy.sh <project-id> [region] [environment]

set -euo pipefail

PROJECT_ID="${1:?Usage: ./deploy.sh <project-id> [region] [environment]}"
REGION="${2:-us-central1}"
ENVIRONMENT="${3:-production}"

echo "🚀 VibeSpec GCP Deployment"
echo "   Project: ${PROJECT_ID}"
echo "   Region:  ${REGION}"
echo "   Env:     ${ENVIRONMENT}"
echo ""

# ─── 1. Enable APIs ──────────────────────────────────────────────
echo "📡 Enabling GCP APIs..."
gcloud services enable \
  container.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  --project="${PROJECT_ID}" \
  --quiet

# ─── 2. Create Artifact Registry ─────────────────────────────────
echo "📦 Setting up Artifact Registry..."
gcloud artifacts repositories create vibespec \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --quiet 2>/dev/null || echo "   (already exists)"

# ─── 3. Build and push Docker images ─────────────────────────────
echo "🐳 Building Docker images..."
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/vibespec"

docker build -t "${REGISTRY}/pipeline:latest" -f deploy/Dockerfile .
docker build -t "${REGISTRY}/qwen-vl:latest" -f deploy/Dockerfile.qwen-vl .
docker build -t "${REGISTRY}/deepseek:latest" -f deploy/Dockerfile.deepseek .

echo "📤 Pushing images..."
docker push "${REGISTRY}/pipeline:latest"
docker push "${REGISTRY}/qwen-vl:latest"
docker push "${REGISTRY}/deepseek:latest"

# ─── 4. Create GCS Buckets ───────────────────────────────────────
echo "🪣 Creating GCS buckets..."
gsutil mb -p "${PROJECT_ID}" -l "${REGION}" \
  "gs://${PROJECT_ID}-vibespec-models" 2>/dev/null || echo "   (models bucket exists)"
gsutil mb -p "${PROJECT_ID}" -l "${REGION}" \
  "gs://${PROJECT_ID}-vibespec-io" 2>/dev/null || echo "   (IO bucket exists)"

# ─── 5. Create GKE Cluster ───────────────────────────────────────
echo "☸️  Creating GKE Autopilot cluster..."
gcloud container clusters create-auto "vibespec-${ENVIRONMENT}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --release-channel=regular \
  --quiet 2>/dev/null || echo "   (cluster exists)"

# ─── 6. Deploy to GKE ────────────────────────────────────────────
echo "🚀 Deploying to GKE..."
gcloud container clusters get-credentials "vibespec-${ENVIRONMENT}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}"

kubectl create namespace vibespec 2>/dev/null || echo "   (namespace exists)"

# Replace PROJECT_ID in manifests and apply
for manifest in deploy/k8s/*.yaml; do
  sed "s/PROJECT_ID/${PROJECT_ID}/g" "${manifest}" | kubectl apply -f -
done

# ─── 7. Create Cloud Run Job for pipeline ─────────────────────────
echo "⚡ Creating Cloud Run Job..."
gcloud run jobs create vibespec-pipeline \
  --image="${REGISTRY}/pipeline:latest" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --cpu=4 \
  --memory=16Gi \
  --task-timeout=3600s \
  --max-retries=1 \
  --set-env-vars="QWEN_VL_ENDPOINT=http://qwen-vl.vibespec.svc.cluster.local:8000/v1,DEEPSEEK_ENDPOINT=http://deepseek.vibespec.svc.cluster.local:8000/v1" \
  --quiet 2>/dev/null || echo "   (updating existing job)"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Resources created:"
echo "   GKE Cluster: vibespec-${ENVIRONMENT} (${REGION})"
echo "   Qwen VL:     4× L4 GPU via GKE"
echo "   DeepSeek:    2× A100 GPU via GKE"
echo "   Pipeline:    Cloud Run Job"
echo "   Registry:    ${REGISTRY}"
echo ""
echo "🔧 Next steps:"
echo "   1. Upload model weights: gsutil cp -r ./models gs://${PROJECT_ID}-vibespec-models/"
echo "   2. Run pipeline: gcloud run jobs execute vibespec-pipeline --region=${REGION}"
echo "   3. Monitor: kubectl -n vibespec get pods"
