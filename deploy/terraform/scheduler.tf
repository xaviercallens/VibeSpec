# VibeSpec Scale-to-Zero Scheduler — Terraform
#
# Infrastructure for calendar-based GPU scheduling:
# - Cloud Scheduler (cron triggers for warmup/cooldown)
# - Cloud Functions (scale up/down handler)
# - Firestore (booking state)
# - GKE Autopilot (auto-scales pods to 0 replicas)

terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" { type = string }
variable "region" { type = string; default = "us-central1" }

provider "google" {
  project = var.project_id
  region  = var.region
}

# ─── Enable APIs ──────────────────────────────────────────────────

resource "google_project_service" "scheduler_apis" {
  for_each = toset([
    "cloudscheduler.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firestore.googleapis.com",
    "run.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# ─── Firestore Database (booking state) ──────────────────────────

resource "google_firestore_database" "bookings" {
  name        = "vibespec-bookings"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.scheduler_apis]
}

# ─── Service Account for Scaler Function ─────────────────────────

resource "google_service_account" "scaler" {
  account_id   = "vibespec-scaler"
  display_name = "VibeSpec GPU Scaler"
}

resource "google_project_iam_member" "scaler_gke" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.scaler.email}"
}

resource "google_project_iam_member" "scaler_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.scaler.email}"
}

# ─── Cloud Function: vibespec-scaler ─────────────────────────────

resource "google_storage_bucket" "function_source" {
  name     = "${var.project_id}-vibespec-functions"
  location = var.region
}

resource "google_storage_bucket_object" "scaler_source" {
  name   = "vibespec-scaler-${filemd5("${path.module}/../functions/vibespec-scaler.ts")}.zip"
  bucket = google_storage_bucket.function_source.name
  source = "${path.module}/../functions/vibespec-scaler.zip"
}

resource "google_cloudfunctions2_function" "scaler" {
  name     = "vibespec-scaler"
  location = var.region

  build_config {
    runtime = "nodejs22"
    entry_point = "vibespecScaler"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.scaler_source.name
      }
    }
  }

  service_config {
    max_instance_count    = 1
    available_memory      = "256Mi"
    timeout_seconds       = 120
    service_account_email = google_service_account.scaler.email
    environment_variables = {
      GKE_CLUSTER = "vibespec-v1"
      GKE_REGION  = var.region
      PROJECT_ID  = var.project_id
    }
  }

  depends_on = [google_project_service.scheduler_apis]
}

# ─── Cloud Scheduler: Health Check (every 5 min) ─────────────────

resource "google_cloud_scheduler_job" "health_check" {
  name     = "vibespec-health-check"
  schedule = "*/5 * * * *"
  region   = var.region

  http_target {
    uri         = google_cloudfunctions2_function.scaler.service_config[0].uri
    http_method = "POST"
    body        = base64encode(jsonencode({
      action    = "check-preemption"
      bookingId = "active"
    }))
    headers = {
      "Content-Type" = "application/json"
    }
    oidc_token {
      service_account_email = google_service_account.scaler.email
    }
  }

  depends_on = [google_project_service.scheduler_apis]
}

# ─── Outputs ──────────────────────────────────────────────────────

output "scaler_function_url" {
  value = google_cloudfunctions2_function.scaler.service_config[0].uri
}

output "firestore_database" {
  value = google_firestore_database.bookings.name
}
