# VibeSpec — End-to-End Test Plan & Formal Proof of Correctness

> This document defines (A) the exhaustive E2E test scenarios for the VibeSpec pipeline and (B) the formal proof framework guaranteeing system correctness.

---

# Part A: End-to-End Test Plan

## 1. Test Environment

| Component | Value |
|-----------|-------|
| **Runner** | Vitest + Playwright |
| **Timeout** | 20 min per scenario |
| **Fixture** | `tests/e2e/fixtures/sample-mockups.zip` (10 screens, e-commerce domain) |
| **CI Gate** | All E2E tests must pass before merge to `main` |

---

## 2. E2E Test Scenarios

### 2.1 — Golden Path: Full Pipeline

```
Scenario: Complete mockup-to-live pipeline
  GIVEN a valid .zip archive containing 10 e-commerce mockup screens
  WHEN  `vibespec run --input ./sample-mockups.zip` is executed
  THEN  the pipeline completes within 15 minutes
  AND   a live preview URL is returned
  AND   the following artifacts exist:
        - layout-manifest.json (per screen)
        - PRODUCT-BRIEF.md (per screen)
        - statechart.json (per flow)
        - constraints.ears
        - invariants.tla
        - brand-tokens.json
        - /public/assets/ (icons, images, microcopy)
        - formal_proof.tla
        - a11y-report.json
```

### 2.2 — Phase 1: Ingestion Integrity

```
Scenario: ZIP ingestion with duplicates
  GIVEN a .zip containing 15 screens (5 duplicates)
  WHEN  the ingestion agent processes the archive
  THEN  exactly 10 unique ScreenGroups are returned
  AND   each ScreenGroup has a valid layout-manifest.json
  AND   extracted text matches OCR ground-truth within 95% accuracy
```

```
Scenario: Directory ingestion (non-ZIP)
  GIVEN a local directory with PNG/JPG/WebP files organized in subdirectories
  WHEN  `vibespec ingest --input ./mockup-dir/`
  THEN  all files are discovered recursively
  AND   output is identical in structure to ZIP ingestion
```

```
Scenario: Unsupported file format
  GIVEN a .zip containing .psd and .ai files alongside PNGs
  WHEN  ingestion runs
  THEN  unsupported formats are skipped with warnings
  AND   valid PNGs are processed normally
```

### 2.3 — Phase 2: Constraint Validity

```
Scenario: XState machine is deterministic
  GIVEN a generated statechart.json
  WHEN  parsed by @xstate/inspect
  THEN  no ambiguous transitions exist (each event in each state resolves to exactly one target)
  AND   all states are reachable from the initial state
  AND   no orphan states exist
```

```
Scenario: EARS constraints are well-formed
  GIVEN generated constraints.ears
  WHEN  parsed by the EARS grammar validator
  THEN  every constraint matches the pattern:
        "WHEN [trigger], THE [system] SHALL [response]"
  AND   all referenced states exist in the corresponding statechart.json
```

```
Scenario: TLA+ invariants are syntactically valid
  GIVEN generated invariants.tla
  WHEN  parsed by TLC
  THEN  no syntax errors are reported
  AND   all referenced variables are declared
```

### 2.4 — Phase 3: Asset Generation Quality

```
Scenario: Brand consistency across generated assets
  GIVEN a mockup set with a distinct brand identity (specific palette, typography)
  WHEN  banana-gen synthesizes assets
  THEN  brand-tokens.json contains ≥ 3 primary colors extracted from mockups
  AND   all generated SVG icons use stroke widths within ±0.5px of each other
  AND   generated images have SSIM ≥ 0.7 against mockup aesthetics
```

```
Scenario: Asset optimization
  GIVEN generated raw assets
  WHEN  the optimization pipeline runs
  THEN  all SVGs are minified (svgo)
  AND   all raster images are WebP format with quality ≤ 80
  AND   all filenames are content-hashed
  AND   Lighthouse image audit reports zero errors
```

```
Scenario: Microcopy localization readiness
  GIVEN generated microcopy.json
  WHEN  validated
  THEN  each entry has keys: id, defaultText, context
  AND   no hardcoded text exists in generated components (all text references microcopy IDs)
```

### 2.5 — Phase 4: Antigravity Deployment

```
Scenario: Generated app enforces route guards
  GIVEN a deployed app with XState-driven routing
  WHEN  a user attempts to navigate to /checkout with an empty cart
  THEN  the app redirects to /cart or returns 403
  AND   the XState actor for CartFlow is in state "Empty"
```

```
Scenario: Component hierarchy matches spec
  GIVEN a deployed app
  WHEN  the DOM is inspected
  THEN  the component tree depth and nesting matches PRODUCT-BRIEF.md
  AND   all semantic HTML5 tags specified in the brief are present
  AND   responsive breakpoints from the brief are honored (test at 320px, 768px, 1024px, 1440px)
```

```
Scenario: Hot deployment produces live URL
  GIVEN a complete MCP payload
  WHEN  deployed via AntigravityClient
  THEN  a live HTTPS URL is returned within 60 seconds
  AND   the URL responds with HTTP 200
  AND   the page renders without console errors
```

### 2.6 — Phase 5: RL Validation & Proofs

```
Scenario: RL agent achieves interaction coverage
  GIVEN a deployed app at a live URL
  WHEN  the RL agent runs for 1000 episodes
  THEN  interaction coverage ≥ 95 % (unique elements interacted / total interactive elements)
  AND   all responsive breakpoints (320px, 768px, 1024px, 1440px) are visited
```

```
Scenario: Symbolic monitor detects injected violations
  GIVEN a deployed app with 5 intentionally injected constraint violations
  WHEN  the RL agent + symbolic monitor run
  THEN  all 5 violations are detected
  AND   each violation report includes: constraint ID, DOM trace, state snapshot
```

```
Scenario: Self-healing loop repairs code
  GIVEN a detected constraint violation
  WHEN  the self-healing loop triggers
  THEN  Antigravity receives the DOM trace
  AND   recompiles the affected component
  AND   re-verification confirms the constraint now holds
  AND   the fix does not introduce new violations
```

```
Scenario: Formal proof certificate generated
  GIVEN an app where the RL agent exhausts the state space with zero violations
  WHEN  proof generation runs
  THEN  formal_proof.tla is created
  AND   TLC model-checker verifies all invariants pass
  AND   the proof certificate includes: timestamp, invariant count, state space size, episodes run
```

```
Scenario: Accessibility compliance
  GIVEN a deployed app
  WHEN  the A11y agent traverses using only keyboard and screen-reader APIs
  THEN  every interactive element is reachable via Tab
  AND   every element has appropriate ARIA labels
  AND   color contrast ratios meet WCAG 2.2 AAA (7:1 for normal text)
  AND   a11y-report.json shows zero violations
```

### 2.7 — End-to-End: CLI Orchestration

```
Scenario: CLI help and version
  WHEN  `vibespec --help`
  THEN  all subcommands are listed: init, ingest, generate, deploy, verify, run
  WHEN  `vibespec --version`
  THEN  semantic version is printed
```

```
Scenario: Partial pipeline recovery
  GIVEN the pipeline fails at Phase 3 (Banana API timeout)
  WHEN  `vibespec run --resume` is executed
  THEN  phases 1 and 2 are skipped (cached artifacts reused)
  AND   phase 3 retries from the failed asset
  AND   the pipeline completes successfully
```

```
Scenario: Invalid input handling
  GIVEN an empty .zip file
  WHEN  `vibespec run --input ./empty.zip`
  THEN  exit code 1 with clear error message: "No valid mockup files found"
  AND   no partial artifacts are left on disk
```

---

## 3. Test Data & Fixtures

| Fixture | Contents | Purpose |
|---------|----------|---------|
| `sample-mockups.zip` | 10 e-commerce screens (landing, catalog, product, cart, checkout, auth, profile, search, orders, 404) | Golden path |
| `duplicate-mockups.zip` | 15 screens (5 exact duplicates) | Dedup testing |
| `mixed-formats/` | PNG + PSD + AI files | Unsupported format handling |
| `empty.zip` | Empty archive | Error handling |
| `single-screen.png` | One standalone mockup | Minimal input |
| `injected-violations/` | App source with 5 known bugs | RL detection testing |

---

# Part B: Formal Proof of Correctness

## 4. Proof Framework

The VibeSpec system provides a **Neuro-Symbolic Formal Proof of Correctness** that guarantees the generated application adheres to all specified constraints. The proof combines two complementary verification strategies:

1. **Static Verification** — TLA+ model-checking of navigation invariants
2. **Dynamic Verification** — RL-driven exhaustive runtime exploration

---

## 5. Formal Definitions

### 5.1 System Model

Let the generated application be modeled as a finite-state transition system:

```
M = (S, s₀, A, T, L)
```

Where:
- **S** = finite set of application states (XState actor configurations)
- **s₀ ∈ S** = initial state
- **A** = finite set of user actions (click, navigate, submit, type)
- **T : S × A → S** = deterministic transition function
- **L : S → 2^{AP}** = labeling function mapping states to atomic propositions

### 5.2 Constraint Language

Constraints extracted in Phase 2 are formalized as:

#### Safety Invariants (□φ — "always φ")

```
∀s ∈ Reachable(M): φ(s) holds
```

**Example:**
```tla+
Invariant_Checkout_Access ==
    ∀ s ∈ States :
        s.currentRoute = "/checkout" ⟹ s.cart.items ≠ {}
```

Translation: *"In every reachable state, if the current route is `/checkout`, the cart must be non-empty."*

#### Liveness Properties (◇φ — "eventually φ")

```
∀ execution π of M: ∃ i such that π[i] ⊨ φ
```

**Example:**
```tla+
Liveness_Order_Confirmation ==
    ∀ π where π[0].currentRoute = "/checkout" ∧ Action(π, "submit") :
        ◇ (π.currentRoute = "/order-confirmation")
```

Translation: *"For every execution starting at checkout with a submit action, the order confirmation page is eventually reached."*

#### Reachability Constraints

```
∀ s_target ∈ RequiredStates :
    ∃ path (s₀, a₁, s₁, ..., aₙ, s_target) in M
```

Translation: *"Every page defined in the specification is reachable from the initial state."*

---

## 6. Static Verification: TLA+ Model Checking

### 6.1 TLA+ Specification Structure

```tla+
------------------------------ MODULE VibeSpec ------------------------------

EXTENDS Naturals, Sequences, FiniteSets

CONSTANTS
    Pages,          \* Set of all page routes
    Actions,        \* Set of all user actions
    Guards          \* Map: (Page, Action) -> Boolean precondition

VARIABLES
    currentPage,    \* Current active route
    appState,       \* Application state record (cart, auth, etc.)
    history         \* Navigation history stack

vars == <<currentPage, appState, history>>

---------------------------------------------------------------------------

Init ==
    /\ currentPage = "/"
    /\ appState = [cart |-> {}, auth |-> FALSE, user |-> NULL]
    /\ history = <<>>

Navigate(target, action) ==
    /\ Guards[currentPage, action]     \* Precondition must hold
    /\ currentPage' = target
    /\ history' = Append(history, currentPage)
    /\ UNCHANGED appState

AddToCart(item) ==
    /\ currentPage = "/product"
    /\ appState' = [appState EXCEPT !.cart = appState.cart \cup {item}]
    /\ UNCHANGED <<currentPage, history>>

Authenticate(user) ==
    /\ currentPage = "/login"
    /\ appState' = [appState EXCEPT !.auth = TRUE, !.user = user]
    /\ UNCHANGED <<currentPage, history>>

Next ==
    \/ \E p \in Pages, a \in Actions : Navigate(p, a)
    \/ \E item \in Items : AddToCart(item)
    \/ \E user \in Users : Authenticate(user)

---------------------------------------------------------------------------
\* INVARIANTS (Safety Properties)

NoCheckoutWithEmptyCart ==
    currentPage = "/checkout" => appState.cart /= {}

NoProfileWithoutAuth ==
    currentPage = "/profile" => appState.auth = TRUE

AllPagesReachable ==
    \A p \in Pages : \E trace \in Traces : p \in Range(trace)

\* TEMPORAL PROPERTIES
Spec == Init /\ [][Next]_vars
         /\ WF_vars(Next)

THEOREM Spec => [](NoCheckoutWithEmptyCart)
THEOREM Spec => [](NoProfileWithoutAuth)
THEOREM Spec => <>(\A p \in Pages : Visited(p))

===========================================================================
```

### 6.2 Model-Checking Procedure

```bash
# 1. Generate TLA+ spec from constraints
vibespec verify --generate-spec

# 2. Run TLC model checker
java -jar tla2tools.jar -config VibeSpec.cfg VibeSpec.tla

# 3. Expected output for a correct system:
# Model checking completed. No error has been found.
#   Distinct states found:    847
#   States examined:         2,341
#   Invariants checked:         12
#   Temporal properties:         3
```

---

## 7. Dynamic Verification: RL Exhaustive Exploration

### 7.1 Formal Coverage Criterion

The RL agent establishes **empirical exhaustiveness** by covering the observable state-action space:

```
Coverage(Agent) = |{ (s, a) : Agent visited (s, a) }| / |S × A|
```

**Threshold:** Coverage ≥ 0.95 (95%)

### 7.2 Symbolic Runtime Monitor

During RL exploration, the Symbolic Monitor maintains:

```
Monitor(trace) = ∀ i ∈ [0, |trace|]:
    ∀ φ ∈ Constraints:
        Evaluate(φ, trace[i].state) = TRUE
```

If any `Evaluate(φ, state) = FALSE`:
1. **Violation logged:** `{ constraint: φ, state: trace[i], action: trace[i-1].action, dom_snapshot: ... }`
2. **Self-heal triggered:** DOM trace → Antigravity → recompile → re-verify

### 7.3 Combined Proof Certificate

The formal proof certificate (`formal_proof.tla`) is generated when **both** verification strategies succeed:

```
ProofCertificate = {
    static_verification: {
        tool: "TLC",
        spec: "VibeSpec.tla",
        result: "PASS",
        states_explored: N,
        invariants_verified: K,
        temporal_properties_verified: T,
        timestamp: ISO8601
    },
    dynamic_verification: {
        tool: "RL-Validator",
        coverage: 0.97,
        episodes: 1000,
        violations_found: 0,
        self_heal_cycles: 0,
        timestamp: ISO8601
    },
    accessibility: {
        tool: "A11y-Agent",
        standard: "WCAG 2.2 AAA",
        violations: 0,
        elements_tested: M,
        timestamp: ISO8601
    },
    conclusion: "FORMALLY VERIFIED — All safety invariants, liveness
                 properties, and accessibility requirements hold across
                 the complete reachable state space."
}
```

---

## 8. Proof Obligations Summary

| ID | Property | Type | Verification Method | Status |
|----|----------|------|---------------------|--------|
| P1 | No checkout with empty cart | Safety Invariant | TLC + RL | ⬜ |
| P2 | No profile without authentication | Safety Invariant | TLC + RL | ⬜ |
| P3 | All pages reachable from root | Reachability | TLC + RL | ⬜ |
| P4 | Order confirmation after checkout submit | Liveness | TLC (WF) | ⬜ |
| P5 | No orphan states in navigation graph | Safety Invariant | TLC | ⬜ |
| P6 | Deterministic transitions (no ambiguity) | XState Validity | Static Analysis | ⬜ |
| P7 | Route guards enforce constraints | Safety Invariant | RL | ⬜ |
| P8 | WCAG 2.2 AAA compliance | Accessibility | A11y Agent | ⬜ |
| P9 | Responsive breakpoints honored | UI Consistency | RL (multi-viewport) | ⬜ |
| P10 | Self-healing closes all detected violations | Convergence | RL + Antigravity Loop | ⬜ |

---

## 9. Proof Soundness & Limitations

### Soundness Argument
- **TLC model checking** provides *exhaustive* verification over the *abstract* state model — if invariants hold in the model, they hold in *all* reachable states.
- **RL exploration** provides *empirical* verification over the *concrete* implementation — covering the gap between abstract model and actual DOM behavior.
- **Combined**, the two strategies address both *specification-level* and *implementation-level* correctness.

### Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| TLA+ model abstracts away asynchronous effects | Timing-dependent bugs may be missed | RL agent tests under various network latencies |
| RL coverage < 100 % | Unexplored state-action pairs may hide bugs | Curriculum learning + manual exploration seeds |
| State space explosion for complex apps | TLC may not terminate | Symmetry reduction, bounded model checking |
| Visual correctness not formally verified | Layout pixel-perfection not guaranteed | SSIM checks + Lighthouse audits |
| Third-party API behavior not modeled | External service failures not covered | Fault injection testing in E2E suite |

---

## 10. Conclusion

The VibeSpec formal verification framework provides a **two-tier guarantee**:

1. **Mathematical Proof (TLC):** All navigation invariants and state constraints are verified exhaustively over the abstract state model.
2. **Empirical Proof (RL Agent):** The concrete implementation is stress-tested to ≥ 95% state-action coverage, with real-time symbolic constraint monitoring.

Together, these produce a **Formal Proof of Correctness** (`formal_proof.tla`) that certifies the generated application faithfully implements the design intent captured from the original mockups — bridging the gap from "vibe" to verified, production-ready code.
