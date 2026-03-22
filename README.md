<p align="center">
  <h1 align="center">🚀 VibeSpec</h1>
  <p align="center">
    <strong>The "Vibe-to-Spec" pipeline for autonomous front-end engineering.</strong>
  </p>
  <p align="center">
    Mockups → Formal Specs → Assets → Deployed Code → Mathematical Proofs
  </p>
  <p align="center">
    <a href="#quickstart">Quickstart</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#phases">Phases</a> •
    <a href="#open-source-stack">Open-Source Stack</a> •
    <a href="#gcp-deployment">GCP Deployment</a> •
    <a href="#contributing">Contributing</a>
  </p>
</p>

---

## What is VibeSpec?

VibeSpec transforms raw UI mockups into **mathematically proven, production-ready code** — autonomously.

It bridges the gap between unstructured design intent ("vibe-coding") and enterprise-grade software by:

1. **Ingesting** mockup images or Google Stitch exports
2. **Formalizing** designs into EARS requirements, XState machines, and TLA+ invariants
3. **Synthesizing** brand-cohesive assets via Gemini Banana
4. **Deploying** through Google Antigravity's agentic IDE
5. **Proving** correctness with RL exploration + Z3/TLA+ formal verification

> **Zero hallucinations. Zero flaky tests. Mathematically guaranteed.**

---

## Quickstart

```bash
# Install
pnpm install

# Run the full pipeline on a mockup directory
npx vibespec run --input ./mockups --output ./output

# Or import a Google Stitch project (deterministic, no VLM needed)
npx vibespec run --input ./stitch-export --output ./output

# Run individual phases
npx vibespec ingest --input ./mockups.zip
npx vibespec verify --url https://preview.example.com
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_BANANA_API_KEY` | Production | Gemini Banana asset synthesis API key |
| `ANTIGRAVITY_TOKEN` | Production | Google Antigravity workspace token |
| `QWEN_VL_ENDPOINT` | Optional | Qwen2.5-VL model endpoint (falls back to heuristic) |
| `DEEPSEEK_ENDPOINT` | Optional | DeepSeek V3.2 self-healing endpoint |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VibeSpec Pipeline                           │
├─────────────┬─────────────┬─────────────┬───────────┬──────────┤
│  Phase 1    │  Phase 2    │  Phase 3    │  Phase 4  │ Phase 5  │
│  Ingestion  │  NeuroSym   │  BananaGen  │  Bridge   │ Validate │
│             │             │             │           │          │
│ • FileParser│ • EARS      │ • Brand     │ • MCP     │ • RL     │
│ • Dedup     │ • XState    │   Tokens    │   Payload │   Agent  │
│ • OCR      │ • TLA+      │ • Icons     │ • Deploy  │ • Z3     │
│ • VLM/     │ • Product   │ • WebP      │ • Route   │ • TLA+   │
│   Stitch    │   Briefs    │ • Microcopy │   Guards  │ • NSVE   │
│ • Grouper  │ • Flows     │ • SVG Opt   │ • Code    │ • A11y   │
│             │             │             │   Gen     │ • Proof  │
└─────────────┴─────────────┴─────────────┴───────────┴──────────┘
```

### Dual Ingestion Paths

| Mode | Input | VLM Required | Deterministic |
|------|-------|:------------:|:-------------:|
| **Traditional** | `.zip` / image directory | ✅ Qwen2.5-VL | No (probabilistic) |
| **Stitch Native** | DESIGN.md + flow.json + TSX | ❌ | Yes (exact tokens) |

---

## Phases

### Phase 1: Multimodal Ingestion Engine — `@vibespec/ingestion`

Parses raw mockups into structured `layout-manifest.json` files.

- **FileParser** — recursive `.zip` extraction and directory traversal
- **Deduplicator** — dHash perceptual hashing (Hamming distance ≤ 5)
- **OCRExtractor** — pluggable text extraction backend
- **VariationGrouper** — groups hover/dropdown states with root screens
- **VLMMapper** — Qwen2.5-VL-72B visual perception (with heuristic fallback)
- **StitchParser** — native Google Stitch ingestion (DESIGN.md, flow.json, components)
- **DesignTokenEngine** — converts design tokens to `tailwind.config.ts` + Z3 SMT-LIB2

### Phase 2: Neuro-Symbolic Specification — `@vibespec/neuro-sym`

Translates probabilistic designs into deterministic formal logic.

- **ProductBriefGenerator** — `PRODUCT-BRIEF.md` with hierarchy, breakpoints, semantic HTML
- **FlowExtractor** — `user-flow.json` directed graph from interactive elements
- **XStateSynthesizer** — XState v5 state machine from user flows
- **EARSGenerator** — `constraints.ears` in EARS notation
- **TLAGenerator** — `invariants.tla` with safety, liveness, and reachability invariants

### Phase 3: Gemini Banana Asset Synthesis — `@vibespec/banana-gen`

Replaces placeholders with production-ready, brand-cohesive assets.

- **BrandFingerprinter** — k-means color clustering, typography, shape extraction
- **AssetFoundry** — icons, backgrounds, logos via Gemini Banana API
- **AssetOptimizer** — **svgo** (SVG) + **sharp** (WebP conversion, responsive variants)
- **MicrocopyGenerator** — SEO-optimized titles, meta descriptions, i18n text

### Phase 4: Antigravity Bridge — `@vibespec/antigravity-bridge`

Assembles and deploys via Model Context Protocol (MCP).

- **MCPPayloadBuilder** — bundles all artifacts into an MCP envelope
- **ComponentGenerator** — React/Next.js component scaffolding
- **RouteWirer** — XState → Zustand middleware → Router guards
- **AntigravityClient** — workspace creation and hot-deploy to live preview URL

### Phase 5: RL Validation & Formal Proofs — `@vibespec/rl-validator`

Mathematically proves the deployed application matches the specification.

- **RLAgent** — ε-greedy/PPO exploration via Playwright (BrowserGym-compatible)
- **SymbolicMonitor** — real-time EARS constraint enforcement
- **Z3SpatialProver** — SMT-based layout proofs (no-overlap, containment, 44dp tap targets)
- **ScallopBridge** — neuro-symbolic Datalog inference (VLM facts → violations)
- **NSVEEngine** — two-brain architecture (neural perception + symbolic reasoning)
- **SelfHealingLoop** — DeepSeek V3.2 autonomous code repair from counterexample traces
- **A11yAgent** — axe-core + Playwright WCAG 2.2 AAA validation
- **ProofGenerator** — TLA+ formal proof certificates

---

## Open-Source Stack

| Component | Library | License |
|-----------|---------|---------|
| Visual Perception | Qwen2.5-VL-72B | Apache-2.0 |
| Code Repair | DeepSeek V3.2 | DeepSeek License |
| GUI Agent | UI-TARS | Apache-2.0 |
| Spatial Proofs | Z3 Theorem Prover | MIT |
| Neuro-Symbolic | Scallop | Apache-2.0 |
| TLA+ Model Checking | Apalache | Apache-2.0 |
| Browser Automation | Playwright | Apache-2.0 |
| Accessibility | axe-core | MPL-2.0 |
| Image Processing | sharp | Apache-2.0 |
| SVG Optimization | svgo | MIT |
| RL Training | Stable-Baselines3 / Ray RLlib | MIT / Apache-2.0 |
| API Fuzzing | EvoMaster | LGPL-3.0 |

---

## Monorepo Structure

```
vibespec/
├── packages/
│   ├── schemas/              # Shared TypeScript interfaces & JSON schemas
│   ├── ingestion/            # Phase 1: Multimodal ingestion + Stitch parser
│   ├── neuro-sym/            # Phase 2: EARS, XState, TLA+ generation
│   ├── banana-gen/           # Phase 3: Asset synthesis & optimization
│   ├── antigravity-bridge/   # Phase 4: MCP payload & deployment
│   ├── rl-validator/         # Phase 5: RL, Z3, NSVE, proofs
│   └── cli/                  # Pipeline orchestration & CLI
├── tests/e2e/                # End-to-end test suite (26 tests)
├── specs/                    # Architecture specs & cost model
├── .agent/                   # Antigravity workflows & rules
│   ├── workflows/            # Automated development workflows
│   └── rules/                # Constraint enforcement rules
└── .github/workflows/        # CI pipeline (lint → typecheck → test → build)
```

---

## GCP Deployment

Full cost model in [`specs/gcp_deployment_cost_model.md`](specs/gcp_deployment_cost_model.md).

| Tier | Monthly Cost | Use Case |
|------|-------------|----------|
| CI-Only (no GPU) | **$65** | Development & testing |
| Development | **$450** | Spot VMs + low traffic |
| Optimized | **$1,007** | Spot VMs + auto-scaling |
| Full Production | **$2,754** | All GPU on-demand |

**Per-run:** $0.02 (CI simulation) → $3.50 (full GPU pipeline)

---

## Testing

```bash
# Run the full E2E test suite
pnpm test

# Current results: 26/26 tests pass
npx vitest run tests/e2e/pipeline.test.ts
```

### Quality Gates

| Gate | Target | Status |
|------|--------|--------|
| TypeScript build | All 7 packages compile | ✅ |
| E2E tests | 100% pass rate | ✅ 26/26 |
| Constraint violations | Detected | ✅ |
| WCAG 2.2 AAA contrast | Validated | ✅ |
| Formal proof | TLA+ certificate | ✅ |
| Full pipeline E2E | Mockups → Proof | ✅ |

---

## Contributing

We welcome contributions! Please see the [Contributor License Agreement](VibeSpec%20Individual%20Contributor%20License.md) before submitting a PR.

```bash
# Development setup
pnpm install
pnpm build
pnpm test
```

---

## License

See [LICENSE](LICENSE) for details.
