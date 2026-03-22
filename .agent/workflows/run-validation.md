---
description: Validate a deployed application against VibeSpec constraints and generate the formal proof
---
This workflow unleashes the mathematical solvers and chaos testing models to certify the structural and logical integrity of the generated frontend.

// turbo
1. Boot the local Next.js development server (`npm run dev`) in the background.
// turbo
2. Execute the `browser-verifier` skill (`python .agent/skills/browser-verifier/browser_verifier.py`) to launch the headless Playwright instance and the Ray RLlib PPO model. The RL agent will aggressively hunt for UI state violations for 5 minutes.
// turbo
3. Execute the `z3-prover` skill (`python .agent/skills/z3-prover/z3_prover.py`) to evaluate layout mathematics (CSSOM bounds, overflow detection).
4. Auto-Heal Check: If validation fails, read the mathematical error trace and rewrite the failing React/Tailwind code to resolve the bounds conflict. Repeat step 3.
5. Once all validations pass, package the results into the `formal_proof.pdf` deliverable artifact.
