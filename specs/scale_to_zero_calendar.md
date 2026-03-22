# VibeSpec — Scale-to-Zero Calendar Pricing Guide

> End-users book GPU windows via the scheduler API. GPUs start on Spot VMs
> 5 minutes before the window, and scale to zero after it ends.
> **You only pay for what you book.**

---

## How It Works

```
┌──────────────────────────────────────────────────────────────────────┐
│                   VibeSpec GPU Lifecycle                            │
│                                                                      │
│  IDLE ($0)  ─→  WARMING (5min)  ─→  ACTIVE (booked)  ─→  IDLE ($0) │
│                                                                      │
│  ╔═══════╗     ╔═══════════╗     ╔═════════════╗     ╔═══════╗      │
│  ║ 0 pods║──▶  ║ Spot L4   ║──▶  ║ Running     ║──▶  ║ 0 pods║     │
│  ║ $0/hr ║     ║ starting  ║     ║ $0.70/hr    ║     ║ $0/hr ║     │
│  ╚═══════╝     ╚═══════════╝     ╚═════════════╝     ╚═══════╝      │
│                      ▲                   │                           │
│                      │              Preempted?                       │
│                      │                   ▼                           │
│                      │          ╔═════════════╗                      │
│                      └──────────║ On-Demand   ║                      │
│                                 ║ fallback    ║                      │
│                                 ╚═════════════╝                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Pricing Tiers

### Tier: Minimal (Recommended for v1)

| | Spot | On-Demand | Resources |
|---|---|---|---|
| **Per hour** | **$0.70** | $2.31 | 1× L4 GPU + CPU |
| **Per 30 min** | **$0.35** | $1.16 | |
| **Per 15 min** | **$0.18** | $0.58 | |
| **Per run (~2 min)** | **$0.09** | $0.09 | |

### Tier: Standard (72B VLM)

| | Spot | On-Demand | Resources |
|---|---|---|---|
| **Per hour** | **$3.14** | $8.94 | 4× L4 GPU + CPU |
| **Per 30 min** | **$1.57** | $4.47 | |

### Tier: Full (VLM + DeepSeek)

| | Spot | On-Demand | Resources |
|---|---|---|---|
| **Per hour** | **$9.66** | $23.62 | 4× L4 + 2× A100 + CPU |
| **Per 30 min** | **$4.83** | $11.81 | |

---

## Calendar Booking Examples

### Example 1: Designer books 2-hour morning slot

```
POST /api/bookings
{
  "userId": "designer-1",
  "startTime": "2026-03-23T09:00:00Z",
  "durationMinutes": 120,
  "tier": "minimal"
}

Response:
{
  "id": "bk-1711180800-a3f2k9",
  "status": "pending",
  "estimatedCost": 1.40,
  "vmType": "spot",
  "warmupAt": "2026-03-23T08:57:00Z"
}
```

**Cost: $1.40** for 2 hours on Spot

### Example 2: Weekly team schedule

| Day | Window | Tier | Spot Cost |
|-----|--------|------|-----------|
| Mon | 09:00-12:00 (3hr) | minimal | $2.10 |
| Tue | 10:00-11:00 (1hr) | minimal | $0.70 |
| Wed | 09:00-17:00 (8hr) | standard | $25.12 |
| Thu | 14:00-16:00 (2hr) | minimal | $1.40 |
| Fri | 09:00-11:00 (2hr) | minimal | $1.40 |

**Weekly total: $30.72** | **Monthly: ~$123**

### Example 3: On-demand single runs (no booking needed)

For occasional use, book a 15-minute window:

```bash
vibespec schedule --start "now" --duration 15 --tier minimal
# Cost: $0.18 (15 min on Spot)
```

---

## Monthly Cost Projections

| Usage Pattern | Hours/Month | Spot Cost | On-Demand |
|---------------|-------------|-----------|-----------|
| **Light** (5 runs/week) | ~2 hr | **$1.40** | $4.62 |
| **Regular** (5 runs/day, weekdays) | ~17 hr | **$11.90** | $39.27 |
| **Heavy** (8 hrs/day, weekdays) | ~176 hr | **$123.20** | $406.56 |
| **Always-on** (24/7) | 720 hr | **$504.00** | $1,663.20 |

> [!TIP]
> The **scale-to-zero** approach saves **95%+** compared to always-on for light/regular usage.
>
> | Pattern | Always-On | Scale-to-Zero | Savings |
> |---------|-----------|---------------|---------|
> | Light | $504/mo | $1.40/mo | **99.7%** |
> | Regular | $504/mo | $11.90/mo | **97.6%** |
> | Heavy | $504/mo | $123.20/mo | **75.6%** |

---

## Infrastructure Costs (Fixed)

These costs apply regardless of GPU usage:

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| GKE Autopilot (management) | ~$72 | Cluster fee (even at 0 pods) |
| Firestore (bookings) | ~$0.10 | Free tier covers most usage |
| Cloud Scheduler | ~$0.30 | 3 cron jobs |
| Cloud Function | ~$0.50 | Invocations |
| PVC Storage (50 GB) | ~$4.00 | Model cache (survives scale-down) |
| **Fixed overhead** | **~$77/mo** | |

> [!NOTE]
> To eliminate the $72/mo GKE management fee, consider using **Cloud Run Jobs** instead of GKE for the minimal tier. Cloud Run has true pay-per-use with no fixed cluster fee.

### Cloud Run Alternative (Lowest Fixed Cost)

| Component | Monthly |
|-----------|---------|
| Cloud Run (GPU, per-use) | $0 idle |
| Firestore | $0.10 |
| Cloud Scheduler | $0.30 |
| Cloud Function | $0.50 |
| **Fixed overhead** | **~$1/mo** |

Cloud Run GPU (L4) pricing: **$0.92/hr** (no Spot, but true scale-to-zero with $0 fixed cost)

---

## Spot Preemption Handling

| Scenario | What happens | User impact |
|----------|-------------|-------------|
| No preemption | Normal operation | None |
| Preempted mid-run | Auto-fallback to On-Demand | ~30s delay, higher cost |
| Preempted during warmup | Retry on new Spot, then On-Demand | ~1 min delay |
| Repeated preemption | Switch booking to On-Demand for remainder | Cost increases |

**Spot preemption rate** for L4 GPUs in us-central1: ~5-10% (low risk)

---

## API Endpoints

```
POST   /api/bookings                    # Create a booking
GET    /api/bookings                    # List all bookings
GET    /api/bookings/:id               # Get booking details
DELETE /api/bookings/:id               # Cancel booking
GET    /api/calendar?start=YYYY-MM-DD  # Get weekly calendar
GET    /api/calendar/cost?month=YYYY-MM # Monthly cost projection
POST   /api/bookings/quick             # Quick 15-min booking (starts now)
```
