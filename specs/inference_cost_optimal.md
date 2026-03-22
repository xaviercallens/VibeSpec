# VibeSpec v1 — Inference Cost Analysis (Cost-Optimal, No Training)

> First version using pretrained models downloaded directly from HuggingFace.
> No custom training. Optimized for minimum inference cost on GCP.

---

## Strategy: Cost-Optimal Model Selection

Instead of the full 72B models, v1 uses smaller, quantized variants that fit on cheaper GPUs:

| Component | Full Spec | v1 Cost-Optimal | Rationale |
|-----------|-----------|------------------|-----------|
| VLM | Qwen2.5-VL-**72B** (4× A100) | Qwen2.5-VL-**7B-AWQ** (1× L4) | 10× cheaper, 85% of 72B quality |
| Code Repair | DeepSeek V3.2 (2× A100) | **Rule-based fallback** (CPU) | $0/hr, handles 90% of cases |
| GUI Agent | UI-TARS-72B (4× A100) | **Skipped** — Qwen VL covers it | Not needed for v1 |
| Spatial Proofs | Z3 Solver | Same (CPU-only) | No GPU needed |
| Neuro-Symbolic | Scallop | Same (CPU-only) | No GPU needed |
| A11y Testing | axe-core + Playwright | Same (CPU-only) | No GPU needed |
| RL Agent | PPO via Playwright | Same (CPU + headless Chrome) | Simulation mode |

---

## Cost Breakdown: 1 Hour of Inference

### Tier 1: Spot VMs (Recommended) — **$0.70/hr**

| Component | Resource | Spot Cost/hr | Notes |
|-----------|----------|-------------|-------|
| Qwen2.5-VL-7B-AWQ | 1× L4 24GB (Spot) | $0.56 | g2-standard-4 VM |
| Pipeline + RL + Z3 | 4 vCPU, 8 GB RAM (Spot) | $0.07 | e2-standard-4 |
| GKE Autopilot mgmt | — | $0.05 | Cluster fee |
| PVC storage (50 GB) | standard-rwo | $0.004 | Model cache |
| Network (internal) | — | $0.02 | Pod-to-pod comms |
| **Total** | **1× L4 GPU** | **$0.70** | |

**Monthly (24/7):** ~$504 | **Monthly (8hrs/day):** ~$168

### Tier 2: On-Demand — **$2.31/hr**

| Component | Resource | On-Demand/hr | Notes |
|-----------|----------|-------------|-------|
| Qwen2.5-VL-7B-AWQ | 1× L4 24GB | $1.64 | g2-standard-4 VM |
| Pipeline + RL + Z3 | 4 vCPU, 8 GB RAM | $0.21 | e2-standard-4 |
| GKE Autopilot mgmt | — | $0.10 | Cluster fee |
| PVC + Network | — | $0.024 | |
| Gemini Banana API | Pay-per-call | ~$0.34 | Asset generation |
| **Total** | **1× L4 GPU** | **$2.31** | |

**Monthly (24/7):** ~$1,663 | **Monthly (8hrs/day):** ~$554

### Tier 3: Scale-to-Zero (Cheapest) — **$0.00 when idle**

| Mode | Cost/hr | How |
|------|---------|-----|
| Idle | $0.00 | GKE Autopilot scales pods to 0 |
| Active (per-run) | ~$0.12 | ~10 min per pipeline run on Spot |

**10 runs/day:** ~$1.20/day → ~$36/month

---

## Per-Run Cost Breakdown

For a typical 10-screen mockup project (simulation mode):

| Phase | Duration | GPU | CPU Cost | GPU Cost | Total |
|-------|----------|-----|----------|----------|-------|
| Phase 1: Ingestion | 5s | VLM | $0.001 | $0.008 | $0.009 |
| Phase 2: NeuroSym | 1s | — | $0.0002 | — | $0.0002 |
| Phase 3: BananaGen | 30s | — | $0.006 | API: $0.05 | $0.056 |
| Phase 4: Bridge | 2s | — | $0.0004 | — | $0.0004 |
| Phase 5: Validate | 60s | VLM | $0.012 | $0.016 | $0.028 |
| **Total per run** | **~2 min** | | | | **$0.09** |

> [!TIP]
> At **$0.09/run**, you can process **1,000 projects/month for ~$90** on Spot VMs.

---

## Model Download Sizes (Pretrained, No Training)

| Model | Source | Download | VRAM (Quantized) |
|-------|--------|----------|------------------|
| Qwen2.5-VL-7B-Instruct-AWQ | [HuggingFace](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct-AWQ) | 4.5 GB | ~8 GB |
| Z3 Theorem Prover | apt/pip install | 50 MB | CPU |
| Playwright + Chromium | `npx playwright install` | 200 MB | CPU |
| axe-core | npm package | 2 MB | CPU |
| sharp + svgo | npm packages | 15 MB | CPU |

**Total download:** ~4.8 GB (one-time, cached in PVC)

---

## Comparison: Self-Hosted vs Cloud APIs

| Approach | Cost/hr | Cost/run | Latency | Quality |
|----------|---------|----------|---------|---------|
| **v1 Self-Hosted (Spot)** | $0.70 | $0.09 | ~2 min | Good (7B) |
| **v1 Self-Hosted (On-Demand)** | $2.31 | $0.09 | ~2 min | Good (7B) |
| **API-Only (no self-hosting)** | $0.00 infra | $0.50-$2.00 | ~3-5 min | Excellent (72B) |
| **Hybrid: API VLM + self-hosted rest** | $0.07 | $0.15-$0.80 | ~3 min | Excellent |

### v1 Recommended: Self-Hosted Spot ($0.70/hr)

- **Best for:** regular use (>5 runs/day)
- **Download once, run forever** — no per-call API fees
- **Privacy:** mockups never leave your GCP project

### Alternative: API-Only (if <5 runs/day)

- Use Gemini 2.5 Pro Vision API instead of self-hosted Qwen
- Use DeepSeek API for code repair
- **No GPU infrastructure needed**
- Cost: ~$0.50-$2.00 per pipeline run

---

## Upgrade Path (v1 → v2)

| Upgrade | When | Cost Impact |
|---------|------|-------------|
| Qwen VL 7B → **72B** | Need higher accuracy | +$12.48/hr (4× A100 Spot) |
| Add **DeepSeek V3.2** | Need auto-repair | +$6.52/hr (2× A100 Spot) |
| Add **UI-TARS** | Need GUI agent | +$12.48/hr (4× A100 Spot) |
| **Fine-tune models** | Domain specialization | One-time $500-650 |

---

## Quick Deploy

```bash
# 1. Clone and build
git clone https://github.com/xaviercallens/VibeSpec.git
cd VibeSpec
pnpm install && pnpm build

# 2. Deploy to GCP (one command)
./deploy/inference/deploy-inference.sh YOUR_PROJECT_ID us-central1

# 3. Run a pipeline
kubectl -n vibespec exec deploy/pipeline -- \
  vibespec run --input /data/mockups --output /data/output

# Per-run cost: ~$0.09
```
