#!/usr/bin/env bash
# VibeSpec v1.0 - GCP Deployment Orchestrator
# Automates the deployment of the Control Plane (Serverless) and Execution Plane (GKE Spot GPUs).

set -euo pipefail

log() { echo -e "\033[1;36m[VibeSpec-Deploy]\033[0m $1"; }
err() { echo -e "\033[1;31m[ERROR]\033[0m $1" >&2; exit 1; }

PROJECT_ID=${1:-""}
REGION=${2:-"us-central1"}

if [[ -z "$PROJECT_ID" ]]; then
  err "Usage: ./deploy-gcp.sh <PROJECT_ID> [REGION]"
fi

# 1. Initialize Project & Enable Services
log "Initializing GCP Project: $PROJECT_ID in $REGION"
gcloud config set project "$PROJECT_ID"

log "Enabling required Google Cloud APIs (Cloud Run, GKE, SQL, Storage, Vertex AI)..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  container.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com

# 2. Provision serverless control plane (Web Portal)
log "Deploying VibeSpec Web Portal to Cloud Run (Scale-to-Zero)..."
# In a real environment, we would inject ENV vars (DB secrets, Vertex credentials) here.
gcloud run deploy vibespec-control-plane \
  --source apps/web \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10

# 3. Provision Stateful Storage (Firestore & GCS)
log "Initializing Native Firestore for Live Crucible Telemetry..."
# Firestore creation is idempotent, but requires an App Engine binding or explicit native creation
gcloud firestore databases create --location="$REGION" --type=firestore-native || true

log "Creating Deliverable Vault and Ingestion Storage Buckets..."
gsutil mb -l "$REGION" -p "$PROJECT_ID" "gs://${PROJECT_ID}-vibespec-ingestion" || true
gsutil mb -l "$REGION" -p "$PROJECT_ID" "gs://${PROJECT_ID}-vibespec-assets" || true

# 4. Provision Execution Plane (GKE Autopilot + L4 GPUs)
log "Provisioning GKE Autopilot Cluster (Execution Plane)..."
# Autopilot scales nodes automatically, we just need to ensure the cluster exists.
gcloud container clusters create-auto vibespec-exec-plane \
  --region "$REGION" \
  --project "$PROJECT_ID" || log "Cluster might already exist. Continuing..."

gcloud container clusters get-credentials vibespec-exec-plane --region "$REGION" --project "$PROJECT_ID"

# 5. Deploy the Pretrained Model Inference Server
log "Deploying Qwen2.5-VL-7B on L4 Spot GPUs (vLLM)..."
kubectl apply -f infra/k8s/vllm-qwen-spot.yaml

log "Deployment orchestration completed successfully!"
log "Use 'kubectl get pods' to monitor the Qwen-VL model downloading its weights."
