# VibeSpec — Weekly Implementation Plan

> **Timeline:** 6 Weeks (W1 – W6)
> **Start Date:** 2026-03-23
> **Architecture:** Neuro-Symbolic Multi-Agent System (MCP-enabled)
> **Execution Environment:** Google Antigravity (Agentic IDE)
> **Core Engine:** Gemini "Banana" Generative Pipeline

---

## Prerequisites & Environment Bootstrap (Day 0)

| Item | Detail |
|------|--------|
| **Runtime** | Node ≥ 22 / Python ≥ 3.12 |
| **Package Manager** | pnpm (monorepo) |
| **Monorepo Layout** | `packages/{ingestion, neuro-sym, banana-gen, antigravity-bridge, rl-validator, cli}` |
| **CI** | GitHub Actions — lint → test → deploy-preview |
| **Credentials** | Gemini Banana API key, Antigravity workspace token |
| **Artifact Store** | GCS bucket for assets & proofs |

```
vibespec/
├── packages/
│   ├── ingestion/          # Phase 1 — Multimodal Ingestion
│   ├── neuro-sym/          # Phase 2 — Neuro-Symbolic Constraints
│   ├── banana-gen/         # Phase 3 — Gemini Banana Asset Synthesis
│   ├── antigravity-bridge/ # Phase 4 — Antigravity MCP Bridge
│   ├── rl-validator/       # Phase 5 — RL Validation & Formal Proofs
│   └── cli/                # Orchestration CLI
├── specs/                  # Formal specifications
├── proofs/                 # TLA+ / formal proof artifacts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/workflows/
└── docs/
```

---

## Week 1 — Foundations & Phase 1: Multimodal Ingestion Engine

### Goals
Build the intake pipeline: accept raw mockup files, deduplicate, OCR-extract text, and produce a structured `layout-manifest.json`.

### Day-by-Day Breakdown

| Day | Task | Deliverable |
|-----|------|-------------|
| **D1** | Scaffold monorepo (`pnpm`, `tsconfig`, lint, CI skeleton) | Repo structure boots, `pnpm build` passes |
| **D2** | `packages/ingestion` — File parser daemon: recursive `.zip`, directory, PNG/JPG/WebP/Figma-export handlers | `IngestAgent.parse(path)` returns `FileTree` |
| **D3** | Deduplication module (perceptual hashing: pHash / dHash) | Duplicate screens removed before downstream |
| **D4** | OCR extraction (Tesseract.js / Google Vision API) — embedded text from mockups | `screen.extractedText[]` per image |
| **D5** | Visual variation grouping (hover states, dropdowns → root screen) | `ScreenGroup{ root, variants[] }` model |
| **D6** | VLM perception mapping — Vision-Language Model call to deconstruct spatial hierarchies, identify UI atoms (buttons, inputs, carousels), infer CSS Grid/Flex relationships | `layout-manifest.json` per screen |
| **D7** | Integration test: `.zip` → `layout-manifest.json` golden-path | ✅ CI green for ingestion module |

### Key Technical Decisions
- **VLM Provider:** Gemini 2.5 Flash Vision (cost-effective for layout decomposition)
- **Dedup Algorithm:** pHash with Hamming distance ≤ 5 for "same screen" threshold
- **Manifest Schema:** JSON Schema-validated `layout-manifest.json` (publish as `@vibespec/schemas`)

### Exit Criteria
- [ ] `IngestAgent.ingest(zipPath)` → returns grouped, deduped `ScreenGroup[]` with `layout-manifest.json`
- [ ] Unit tests ≥ 90 % coverage for ingestion package
- [ ] CI pipeline green

---

## Week 2 — Phase 2: Neuro-Symbolic Specification & Constraint Generation

### Goals
Translate VLM perception output into deterministic formal specifications: product briefs, XState machines, and TLA+ invariants.

### Day-by-Day Breakdown

| Day | Task | Deliverable |
|-----|------|-------------|
| **D1** | `packages/neuro-sym` scaffold; consume `layout-manifest.json` | Module boots, types shared |
| **D2** | `PRODUCT-BRIEF.md` generator: component hierarchy, responsive breakpoints, semantic HTML5 tags per screen | Markdown brief per screen |
| **D3** | User-flow extraction: analyze visual overlaps / button targets to deduce journey graph | `user-flow.json` (directed graph) |
| **D4** | XState machine synthesis from flow graph | `statechart.json` per flow (XState v5 compatible) |
| **D5** | EARS constraint generator: "WHEN [trigger], THE [system] SHALL [response]" | `constraints.ears` per flow |
| **D6** | TLA+ formal invariant generator (temporal logic) | `invariants.tla` stubs per constraint set |
| **D7** | Integration test: `layout-manifest.json` → `PRODUCT-BRIEF.md` + `statechart.json` + `constraints.ears` | ✅ CI green for neuro-sym module |

### Key Technical Decisions
- **State Machine Format:** XState v5 JSON for direct runtime consumption
- **EARS Templates:** Parameterized templates with slot-filling from VLM output
- **TLA+ Scope:** Focus on navigation invariants and state reachability; model-check with TLC

### Exit Criteria
- [ ] Given any `layout-manifest.json`, the module outputs `PRODUCT-BRIEF.md`, `statechart.json`, `constraints.ears`, and `invariants.tla`
- [ ] XState machines are valid (parseable by `@xstate/inspect`)
- [ ] Unit tests ≥ 85 % coverage

---

## Week 3 — Phase 3: Generative Asset Synthesis (Gemini "Banana")

### Goals
Extract brand identity from mockups and autonomously generate all missing visual assets (icons, imagery, microcopy).

### Day-by-Day Breakdown

| Day | Task | Deliverable |
|-----|------|-------------|
| **D1** | `packages/banana-gen` scaffold; Gemini Banana API client wrapper with retry/rate-limit | API client with typed responses |
| **D2** | Brand Fingerprinting module: extract color palettes, corner radiuses, typography weights, shadows from mockups | `brand-tokens.json` (CSS custom properties compatible) |
| **D3** | Icon & Logo Foundry: generate SVG icons with consistent stroke widths + style | `/public/assets/icons/*.svg` |
| **D4** | Contextual Imagery: generate `.webp` backgrounds, product images, avatars | `/public/assets/images/*.webp` |
| **D5** | Microcopy Generator: SEO-optimized titles, subtitles, localization-ready text | `microcopy.json` per screen |
| **D6** | Asset optimization pipeline: hash filenames, optimize formats (svgo, sharp), inject into `/public/assets/` | Optimized asset tree |
| **D7** | Integration test: mockup set → full `/public/assets/` directory with brand-consistent outputs | ✅ CI green for banana-gen module |

### Key Technical Decisions
- **Brand Extraction:** k-means clustering on pixel data for palette; font detection via ML classifier
- **Asset Consistency:** Seed Gemini Banana with `brand-tokens.json` on every generation call
- **Optimization:** `svgo` for SVG, `sharp` for raster → WebP at quality 80

### Exit Criteria
- [ ] Given mockup images, the module generates a complete `/public/assets/` tree
- [ ] SSIM similarity score ≥ 0.7 between generated assets and mockup aesthetics
- [ ] All assets pass Lighthouse image audit (correct format, compressed)

---

## Week 4 — Phase 4: Autonomous Front-End Compilation (Antigravity Bridge)

### Goals
Orchestrate the MCP payload and bridge to Google Antigravity for autonomous code generation, state wiring, and hot deployment.

### Day-by-Day Breakdown

| Day | Task | Deliverable |
|-----|------|-------------|
| **D1** | `packages/antigravity-bridge` scaffold; MCP payload assembler | `MCPPayload` type + builder |
| **D2** | MCP serialization: bundle `PRODUCT-BRIEF.md`, `statechart.json`, `constraints.ears`, `brand-tokens.json`, asset manifest into MCP envelope | Valid MCP message |
| **D3** | Antigravity API integration: workspace creation, file injection, agent invocation | `AntigravityClient.deploy(payload)` |
| **D4** | Constraint-driven routing wiring: inject XState machines into global state (Zustand/Redux) and application router | Routes physically enforce state machine transitions |
| **D5** | Component generation templates: React / Next.js / Svelte scaffolding with shadcn/ui + Tailwind from `PRODUCT-BRIEF.md` | Generated component tree |
| **D6** | Hot deployment module: zero-click browser-based deployment to live URL | Live preview URL returned |
| **D7** | Integration test: full pipeline `MCP payload → live URL` | ✅ CI green for bridge module |

### Key Technical Decisions
- **Framework Default:** Next.js 15 App Router (configurable via CLI flag)
- **State Binding:** XState actors registered as Zustand middleware — route guards are actor state checks
- **MCP Version:** Latest Model Context Protocol specification

### Exit Criteria
- [ ] `AntigravityClient.deploy(payload)` returns a live preview URL
- [ ] Generated app enforces all XState route guards (invalid transitions return 403/redirect)
- [ ] Component tree matches `PRODUCT-BRIEF.md` hierarchy

---

## Week 5 — Phase 5: Autonomous Validation (RL Agent + Formal Proofs)

### Goals
Build the RL exploration agent, symbolic runtime monitor, self-healing loop, and accessibility validator. Output formal proofs of correctness.

### Day-by-Day Breakdown

| Day | Task | Deliverable |
|-----|------|-------------|
| **D1** | `packages/rl-validator` scaffold; headless browser harness (Playwright) | Browser env for RL agent |
| **D2** | RL Exploration Agent: action space (click, type, scroll, navigate), self-healing CV locators, reward function (coverage maximization) | `RLAgent.explore(url)` |
| **D3** | Reward shaping: maximize interaction coverage, test responsive breakpoints, attempt logic bypass | Reward function + episode logging |
| **D4** | Symbolic Engine runtime monitor: intercept state tree changes, cross-reference against `constraints.ears` in real-time | `SymbolicMonitor.watch(stateTree)` |
| **D5** | Self-Healing Loop: on constraint violation → capture DOM trace → send back to Antigravity → recompile → re-verify | Closed loop patch cycle |
| **D6** | Formal Proof output: if RL agent exhausts state space with zero violations → generate `formal_proof.tla` certificate | `formal_proof.tla` with model-check results |
| **D7** | Accessibility agent: screen-reader API navigation, keyboard-only traversal, WCAG 2.2 AAA compliance report | `a11y-report.json` |

### Key Technical Decisions
- **RL Algorithm:** PPO (Proximal Policy Optimization) via stable-baselines3 / custom JS impl
- **State Space:** DOM snapshot hash + XState actor state = composite observation
- **Proof Generation:** TLC model-checker output → human-readable proof certificate
- **A11y Engine:** axe-core + custom keyboard-nav crawler

### Exit Criteria
- [ ] RL agent achieves ≥ 95 % interaction coverage within 1000 episodes
- [ ] Symbolic monitor catches 100 % of injected constraint violations in test suite
- [ ] Self-healing loop successfully patches and re-verifies at least 3 synthetic bugs
- [ ] `formal_proof.tla` generated and TLC-verified
- [ ] A11y report shows zero WCAG 2.2 AAA violations

---

## Week 6 — CLI Orchestration, E2E Integration & Release

### Goals
Wire all packages into the orchestration CLI, run full end-to-end pipeline, finalize documentation, and cut v1.0 release.

### Day-by-Day Breakdown

| Day | Task | Deliverable |
|-----|------|-------------|
| **D1** | `packages/cli` — Commander.js CLI: `vibespec init`, `vibespec ingest`, `vibespec generate`, `vibespec deploy`, `vibespec verify` | CLI commands wired to package APIs |
| **D2** | Full pipeline orchestration: `.zip` → ingest → neuro-sym → banana-gen → antigravity → rl-validate | `vibespec run --input ./mockups.zip` end-to-end |
| **D3** | End-to-end test suite (see `e2e_test_plan.md`) | All E2E tests green |
| **D4** | Error handling, retry policies, graceful degradation across all modules | Robust failure modes |
| **D5** | Documentation: README, API docs (TypeDoc), architecture diagrams (Mermaid) | `/docs/` complete |
| **D6** | Performance profiling: pipeline latency benchmarks, asset generation throughput | Benchmark report |
| **D7** | Release: changelog, semantic version tag `v1.0.0`, publish to npm/GitHub | 🚀 `v1.0.0` released |

### Exit Criteria
- [ ] `vibespec run --input ./mockups.zip` completes end-to-end in < 15 minutes (10-screen mockup set)
- [ ] All E2E tests pass
- [ ] Documentation complete with architecture diagrams
- [ ] npm package published, GitHub release tagged

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini Banana rate limits / quota | Blocks W3 asset generation | Pre-negotiate quota; implement local cache + fallback to DALL-E 3 |
| VLM accuracy on complex layouts | Poor `layout-manifest.json` quality | Multi-pass extraction with human-in-the-loop review flag |
| TLA+ model-checking state explosion | W5 proofs don't terminate | Bound state space; use symmetry reduction; limit proof scope to navigation |
| Antigravity API instability | W4 deployment failures | Mock API for dev; feature-flag live deployment |
| RL agent convergence | W5 coverage < 95 % | Curriculum learning; hand-craft initial exploration sequences |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| **Mockup-to-Live Latency** | < 15 min for 10 screens |
| **Constraint Violation Detection** | 100 % (zero false negatives) |
| **Asset Brand Consistency (SSIM)** | ≥ 0.7 |
| **WCAG 2.2 AAA Compliance** | 100 % |
| **Test Coverage (unit)** | ≥ 85 % across all packages |
| **E2E Pass Rate** | 100 % on golden-path scenarios |
| **Formal Proof** | TLC-verified `formal_proof.tla` |
