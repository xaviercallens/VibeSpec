---
description: Import a Google Stitch project and run the full VibeSpec pipeline
---

# Import Stitch Project

Run this workflow when importing a Google Stitch project (`.zip` export or URL).

## Steps

1. Place the Stitch export in the workspace root:
   ```bash
   # Option A: Unzip the Stitch export
   unzip stitch-export.zip -d ./stitch-project

   # Option B: Keep the .zip (VibeSpec extracts automatically)
   cp ~/Downloads/stitch-export.zip ./
   ```

2. Run the VibeSpec pipeline in Stitch mode:
   ```bash
   npx vibespec run --input ./stitch-project --output ./vibespec-output
   ```

3. The pipeline auto-detects Stitch projects (via `DESIGN.md` or `flow.json`) and runs:
   - **Phase 1:** Parse `DESIGN.md` tokens, `flow.json` transitions, React components
   - **Phase 2:** Generate EARS constraints, XState machines, TLA+ invariants
   - **Phase 3:** Replace `stitch-placeholder` tags with Banana-generated assets
   - **Phase 4:** Deploy via Antigravity with constraint-driven routing
   - **Phase 5:** RL validation + Z3/TLA+ formal proof

4. Review generated outputs in `./vibespec-output/`:
   - `tailwind.config.ts` — exact design tokens from DESIGN.md
   - `design-tokens.smt2` — Z3 algebraic constraints
   - `constraints.ears` — EARS requirements
   - `formal_proof.tla` — TLA+ proof certificate
   - `proof-certificate.json` — verification summary

5. If violations are found, the self-healing loop (DeepSeek V3.2) patches the code automatically.
