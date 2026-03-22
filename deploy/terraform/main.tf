# VibeSpec GCP Deployment — Terraform Configuration
#
# Infrastructure:
# 1. GKE Autopilot cluster (model serving + pipeline)
# 2. Cloud Run Job (pipeline execution)
# 3. Artifact Registry (Docker images)
# 4. GCS Bucket (model weights, pipeline I/O)
# 5. Cloud Build triggers (CI/CD)

terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "vibespec-terraform-state"
    prefix = "terraform/state"
  }
}

# ─── Variables ────────────────────────────────────────────────────

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

# ─── Provider ─────────────────────────────────────────────────────

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── Enable APIs ──────────────────────────────────────────────────

resource "google_project_service" "apis" {
  for_each = toset([
    "container.googleapis.com",      # GKE
    "run.googleapis.com",            # Cloud Run
    "artifactregistry.googleapis.com", # Docker registry
    "cloudbuild.googleapis.com",     # CI/CD
    "compute.googleapis.com",        # Compute Engine
    "iam.googleapis.com",            # IAM
  ])
  service            = each.value
  disable_on_destroy = false
}

# ─── Artifact Registry ───────────────────────────────────────────

resource "google_artifact_registry_repository" "vibespec" {
  location      = var.region
  repository_id = "vibespec"
  format        = "DOCKER"
  description   = "VibeSpec Docker images"

  depends_on = [google_project_service.apis]
}

# ─── GCS Buckets ──────────────────────────────────────────────────

resource "google_storage_bucket" "model_weights" {
  name          = "${var.project_id}-vibespec-models"
  location      = var.region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition { age = 90 }
    action { type = "SetStorageClass", storage_class = "NEARLINE" }
  }
}

resource "google_storage_bucket" "pipeline_io" {
  name          = "${var.project_id}-vibespec-io"
  location      = var.region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition { age = 30 }
    action { type = "Delete" }
  }
}

# ─── GKE Autopilot Cluster (Model Serving) ────────────────────────

resource "google_container_cluster" "vibespec" {
  name     = "vibespec-${var.environment}"
  location = var.region

  # Autopilot mode — fully managed, pay-per-pod
  enable_autopilot = true

  release_channel {
    channel = "REGULAR"
  }

  ip_allocation_policy {}

  depends_on = [google_project_service.apis]
}

# ─── Service Account ─────────────────────────────────────────────

resource "google_service_account" "vibespec_runner" {
  account_id   = "vibespec-runner"
  display_name = "VibeSpec Pipeline Runner"
}

resource "google_project_iam_member" "runner_gcs" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.vibespec_runner.email}"
}

resource "google_project_iam_member" "runner_ar" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.vibespec_runner.email}"
}

# ─── Cloud Run Job (Pipeline) ─────────────────────────────────────

resource "google_cloud_run_v2_job" "pipeline" {
  name     = "vibespec-pipeline"
  location = var.region

  template {
    template {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/vibespec/pipeline:latest"

        resources {
          limits = {
            cpu    = "4"
            memory = "16Gi"
          }
        }

        env {
          name  = "QWEN_VL_ENDPOINT"
          value = "http://qwen-vl.vibespec.svc.cluster.local:8000/v1"
        }
        env {
          name  = "DEEPSEEK_ENDPOINT"
          value = "http://deepseek.vibespec.svc.cluster.local:8000/v1"
        }
        env {
          name  = "GCS_BUCKET"
          value = google_storage_bucket.pipeline_io.name
        }
      }

      service_account = google_service_account.vibespec_runner.email
      timeout         = "3600s"
      max_retries     = 1
    }
  }

  depends_on = [google_project_service.apis]
}

# ─── Cloud Build Trigger (CI/CD) ──────────────────────────────────

resource "google_cloudbuild_trigger" "vibespec_ci" {
  name     = "vibespec-ci"
  location = var.region

  github {
    owner = "xaviercallens"
    name  = "VibeSpec"
    push {
      branch = "^main$"
    }
  }

  filename = "deploy/cloudbuild.yaml"

  depends_on = [google_project_service.apis]
}

# ─── Outputs ──────────────────────────────────────────────────────

output "cluster_name" {
  value = google_container_cluster.vibespec.name
}

output "artifact_registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/vibespec"
}

output "model_bucket" {
  value = google_storage_bucket.model_weights.name
}

output "pipeline_io_bucket" {
  value = google_storage_bucket.pipeline_io.name
}
