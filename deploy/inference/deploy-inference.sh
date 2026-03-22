#!/usr/bin/env bash
# VibeSpec v1 — Inference-Only Deployment (No Training Required)
#
# Downloads pretrained models from HuggingFace and runs inference
# using the cheapest possible GPU configuration on GCP.
#
# Cost-Optimal Config:
#   Qwen2.5-VL-7B-Instruct (quantized)  → 1× L4 24GB  → $0.56/hr Spot
#   DeepSeek-V3-0324 (API fallback)      → 0 GPU        → $0.00/hr
#   Z3 + Scallop + axe-core              → CPU only     → $0.00
#   Pipeline + RL Agent                  → CPU + Chrome  → $0.07/hr
#   TOTAL                                → 1× L4 GPU    → $0.70/hr Spot
#
# Usage:
#   ./deploy-inference.sh <project-id> [region]

set -euo pipefail

PROJECT_ID="${1:?Usage: ./deploy-inference.sh <project-id> [region]}"
REGION="${2:-us-central1}"

echo "🚀 VibeSpec v1 — Inference-Only Deployment"
echo "   Project: ${PROJECT_ID}"
echo "   Region:  ${REGION}"
echo "   Mode:    Pretrained models (no training)"
echo "   Cost:    ~\$0.70/hr (Spot) or ~\$2.31/hr (On-Demand)"
echo ""

# ─── 1. Enable APIs ──────────────────────────────────────────────
echo "📡 Enabling GCP APIs..."
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
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

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/vibespec"

# ─── 3. Build inference-optimized images ──────────────────────────
echo "🐳 Building inference containers..."

# Pipeline container (includes Z3, Scallop, axe-core, Playwright)
docker build -t "${REGISTRY}/pipeline:v1" \
  -f deploy/Dockerfile .

# Qwen VL 7B quantized (fits on single L4)
docker build -t "${REGISTRY}/qwen-vl-7b:v1" \
  -f deploy/inference/Dockerfile.qwen-7b .

echo "📤 Pushing to Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
docker push "${REGISTRY}/pipeline:v1"
docker push "${REGISTRY}/qwen-vl-7b:v1"

# ─── 4. Create GKE Autopilot cluster ─────────────────────────────
echo "☸️  Creating GKE Autopilot cluster..."
gcloud container clusters create-auto "vibespec-v1" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --release-channel=regular \
  --quiet 2>/dev/null || echo "   (cluster exists)"

gcloud container clusters get-credentials "vibespec-v1" \
  --region="${REGION}" \
  --project="${PROJECT_ID}"

# ─── 5. Deploy inference workloads ────────────────────────────────
echo "🚀 Deploying inference workloads..."
kubectl create namespace vibespec 2>/dev/null || true

# Apply inference-optimized manifests
for manifest in deploy/inference/k8s/*.yaml; do
  sed "s/PROJECT_ID/${PROJECT_ID}/g; s/REGION/${REGION}/g" "${manifest}" | \
    kubectl apply -f -
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "💰 Running costs (estimated):"
echo "   Spot VM:       ~\$0.70/hr (\$16.80/day, \$504/month)"
echo "   On-Demand:     ~\$2.31/hr (\$55.44/day, \$1,663/month)"
echo "   Scale-to-zero: \$0.00/hr when idle (GKE Autopilot)"
echo ""
echo "🔧 Run a pipeline:"
echo "   kubectl -n vibespec exec -it deploy/pipeline -- vibespec run --input /data/mockups --output /data/output"
echo ""
echo "📊 Monitor:"
echo "   kubectl -n vibespec get pods"
echo "   kubectl -n vibespec logs deploy/qwen-vl-7b -f"
