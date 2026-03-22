# VibeSpec — Model Training Cost Analysis (1 Hour on GCP)

> Detailed cost breakdown for fine-tuning/training each pretrained model used in the VibeSpec pipeline on Google Cloud Platform.

---

## Executive Summary

| Model | GPU Config | 1-Hour Cost (Spot) | 1-Hour Cost (On-Demand) | VRAM Required |
|-------|-----------|-------------------|------------------------|---------------|
| **Qwen2.5-VL-72B** | 4× A100 80GB | **$13.04** | **$29.36** | 280 GB |
| **DeepSeek V3.2** | 8× A100 80GB | **$26.08** | **$58.72** | 560 GB |
| **UI-TARS-72B** | 4× A100 80GB | **$13.04** | **$29.36** | 280 GB |
| **Scallop (neuro-sym)** | 1× L4 24GB | **$0.77** | **$2.24** | 16 GB |
| **RL Agent (PPO)** | 1× T4 16GB | **$0.35** | **$1.40** | 8 GB |
| **Total (all models)** | **18× GPUs** | **$53.28** | **$121.08** | — |

> [!IMPORTANT]
> Training costs are significantly higher than inference costs. The models above are used for **fine-tuning on domain-specific data** (Design2Code, WebSight, Rico datasets). Full pre-training from scratch is not recommended.

---

## 1. Qwen2.5-VL-72B (Visual Perception)

**Purpose:** Fine-tune for UI mockup → layout-manifest extraction using the Design2Code dataset.

### Hardware Requirements

| Resource | Training | Inference |
|----------|----------|-----------|
| GPU | 4× NVIDIA A100 80GB | 4× NVIDIA L4 24GB |
| VRAM | ~280 GB (mixed FP16+BF16) | ~144 GB (INT4 quant.) |
| CPU | 32 vCPU | 16 vCPU |
| RAM | 256 GB | 64 GB |
| Storage | 500 GB SSD (weights + data) | 200 GB SSD |

### GCP Cost (1 Hour)

| Component | Spot VM | On-Demand |
|-----------|---------|-----------|
| 4× A100 80GB GPU | $12.00 | $27.20 |
| a2-ultragpu-4g VM (48 vCPU, 340 GB) | $0.80 | $1.64 |
| 500 GB pd-ssd | $0.04 | $0.04 |
| Network egress (model pull) | $0.20 | $0.48 |
| **Total per hour** | **$13.04** | **$29.36** |

### Training Configuration

```yaml
model: Qwen/Qwen2.5-VL-72B-Instruct
method: LoRA (rank=64, alpha=128)
dataset: Design2Code (5,000 mockup→code pairs)
batch_size: 4 (gradient accumulation: 8)
learning_rate: 2e-5
epochs: 3
estimated_time: ~4 hours (full fine-tune)
lora_time: ~1.5 hours
```

> [!TIP]
> Use **LoRA fine-tuning** to reduce VRAM to 2× A100 80GB (~$6.52/hr Spot) while retaining 95%+ of full fine-tune quality.

---

## 2. DeepSeek V3.2 (Self-Healing Code Repair)

**Purpose:** Fine-tune on counterexample traces → code patches for autonomous repair.

### Hardware Requirements

| Resource | Training | Inference |
|----------|----------|-----------|
| GPU | 8× NVIDIA A100 80GB | 2× NVIDIA A100 80GB |
| VRAM | ~560 GB (FP16) | ~140 GB (INT4) |
| CPU | 96 vCPU | 16 vCPU |
| RAM | 680 GB | 128 GB |
| Storage | 800 GB SSD | 300 GB SSD |

### GCP Cost (1 Hour)

| Component | Spot VM | On-Demand |
|-----------|---------|-----------|
| 8× A100 80GB GPU | $24.00 | $54.40 |
| a2-ultragpu-8g VM (96 vCPU, 680 GB) | $1.60 | $3.28 |
| 800 GB pd-ssd | $0.06 | $0.06 |
| Network egress | $0.42 | $0.98 |
| **Total per hour** | **$26.08** | **$58.72** |

### Training Configuration

```yaml
model: deepseek-ai/DeepSeek-V3.2
method: LoRA (rank=128, alpha=256)
dataset: VibeSpec counterexample traces (~2,000 violation→patch pairs)
batch_size: 2 (gradient accumulation: 16)
learning_rate: 1e-5
epochs: 5
estimated_time: ~6 hours (full fine-tune)
lora_time: ~2 hours
```

> [!TIP]
> DeepSeek V3.2 can be quantized to INT4 (GPTQ) for inference, reducing serving to 2× A100 ($6.52/hr Spot). Training must stay at FP16.

---

## 3. UI-TARS-72B (GUI Agent Fallback)

**Purpose:** Fine-tune for agentic UI interaction, element grounding, and click prediction.

### Hardware Requirements

| Resource | Training | Inference |
|----------|----------|-----------|
| GPU | 4× NVIDIA A100 80GB | 4× NVIDIA L4 24GB |
| VRAM | ~280 GB (FP16) | ~144 GB (INT4) |
| CPU | 48 vCPU | 16 vCPU |
| RAM | 340 GB | 64 GB |

### GCP Cost (1 Hour)

| Component | Spot VM | On-Demand |
|-----------|---------|-----------|
| 4× A100 80GB GPU | $12.00 | $27.20 |
| a2-ultragpu-4g VM | $0.80 | $1.64 |
| 500 GB pd-ssd | $0.04 | $0.04 |
| Network egress | $0.20 | $0.48 |
| **Total per hour** | **$13.04** | **$29.36** |

### Training Configuration

```yaml
model: bytedance/UI-TARS-72B
method: LoRA (rank=64, alpha=128)
dataset: WebSight v0.2 (800K synthetic UI screenshots)
batch_size: 4 (gradient accumulation: 8)
epochs: 2
estimated_time: ~8 hours (large dataset)
lora_time: ~3 hours
```

---

## 4. Scallop Neuro-Symbolic (Datalog Inference)

**Purpose:** Train probabilistic Datalog program for VLM fact → violation inference.

### Hardware Requirements

| Resource | Value |
|----------|-------|
| GPU | 1× NVIDIA L4 24GB |
| VRAM | 16 GB |
| CPU | 8 vCPU |
| RAM | 32 GB |

### GCP Cost (1 Hour)

| Component | Spot VM | On-Demand |
|-----------|---------|-----------|
| 1× L4 GPU | $0.56 | $1.64 |
| g2-standard-8 VM | $0.17 | $0.50 |
| 100 GB pd-ssd | $0.01 | $0.01 |
| Network | $0.03 | $0.09 |
| **Total per hour** | **$0.77** | **$2.24** |

---

## 5. RL Agent PPO (Reinforcement Learning)

**Purpose:** Train PPO policy for UI exploration and violation discovery.

### Hardware Requirements

| Resource | Value |
|----------|-------|
| GPU | 1× NVIDIA T4 16GB |
| VRAM | 8 GB |
| CPU | 8 vCPU |
| RAM | 32 GB |

### GCP Cost (1 Hour)

| Component | Spot VM | On-Demand |
|-----------|---------|-----------|
| 1× T4 GPU | $0.11 | $0.35 |
| n1-standard-8 VM | $0.20 | $0.95 |
| 50 GB pd-ssd | $0.01 | $0.01 |
| Network | $0.03 | $0.09 |
| **Total per hour** | **$0.35** | **$1.40** |

---

## Cost Optimization Strategies

### 1. Use LoRA Instead of Full Fine-Tuning

| Model | Full FT VRAM | LoRA VRAM | Cost Reduction |
|-------|-------------|-----------|----------------|
| Qwen2.5-VL-72B | 4× A100 (280GB) | 2× A100 (160GB) | **50%** |
| DeepSeek V3.2 | 8× A100 (560GB) | 4× A100 (320GB) | **50%** |
| UI-TARS-72B | 4× A100 (280GB) | 2× A100 (160GB) | **50%** |

### 2. Spot VMs (Up to 70% Discount)

GCP Spot VMs offer ~65% discount but can be preempted. Use checkpointing every 15 minutes.

### 3. Use GKE Autopilot + Spot Pods

```yaml
# Add to pod spec:
nodeSelector:
  cloud.google.com/gke-spot: "true"
tolerations:
  - key: cloud.google.com/gke-spot
    operator: Equal
    value: "true"
    effect: NoSchedule
```

### 4. GCS Model Caching

Pre-download weights to GCS to avoid repeated HuggingFace downloads:
```bash
# One-time: ~$0.02/GB/month storage
gsutil cp -r ./qwen2.5-vl-72b gs://PROJECT-vibespec-models/qwen-vl/
gsutil cp -r ./deepseek-v3.2 gs://PROJECT-vibespec-models/deepseek/
```

### 5. Vertex AI Custom Training (Managed)

| Model | Vertex AI Cost/hr | Advantage |
|-------|-------------------|-----------|
| Qwen2.5-VL-72B | ~$16.00 (A100×4) | Managed, auto-scaling |
| DeepSeek V3.2 | ~$32.00 (A100×8) | No infra management |

---

## Comparison: Training vs Inference vs API Costs

| Scenario | Cost/Hr | Use Case |
|----------|---------|----------|
| **Training (Spot)** | $53.28 | Fine-tuning on Design2Code, WebSight |
| **Training (On-Demand)** | $121.08 | When Spot unavailable |
| **Inference (all models)** | $9.59 | Running pipeline with self-hosted models |
| **API-only (no self-hosted)** | $0.50-$3.00 | Using cloud APIs (Gemini, OpenAI) |

---

## Recommended Training Schedule

| Phase | Models | Hours | Spot Cost | Frequency |
|-------|--------|-------|-----------|-----------|
| Initial fine-tune | All 5 | 8-12 | $426-$639 | One-time |
| Monthly refresh | Qwen VL + DeepSeek | 4 | $156 | Monthly |
| Dataset expansion | Qwen VL only | 2 | $26 | Per dataset |
| RL policy update | PPO agent | 1 | $0.35 | Weekly |

> [!CAUTION]
> **Total one-time training cost (all models, Spot):** ~$500-$650
> **Monthly ongoing cost:** ~$160 for model refreshes
