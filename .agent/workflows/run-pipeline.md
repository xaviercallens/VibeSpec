---
description: Run the full VibeSpec pipeline from mockups to proofs
---

# Full Pipeline Run

Run this workflow to transform mockups into a mathematically verified, deployed application.

## Steps

1. Prepare your input (one of):
   ```bash
   # A directory of mockup images
   ls ./mockups/  # PNG, JPG, WebP files

   # A zip archive
   ls ./mockups.zip

   # A Google Stitch export
   ls ./stitch-project/DESIGN.md
   ```

2. Run the pipeline:
   ```bash
   npx vibespec run --input ./mockups --output ./vibespec-output --framework nextjs
   ```

3. Monitor the 5-phase output:
   - 📥 Phase 1: Ingestion (screens, dedup, OCR, VLM/Stitch)
   - 🧠 Phase 2: Neuro-Symbolic (EARS, XState, TLA+)
   - 🍌 Phase 3: Banana Gen (brand tokens, assets, microcopy)
   - 🚀 Phase 4: Antigravity (MCP payload, deploy)
   - 🔍 Phase 5: Validation (RL, Z3, proofs, a11y)

4. Verify the proof certificate:
   ```bash
   cat ./vibespec-output/proof-certificate.json
   ```

5. Preview the deployed application at the URL printed by Phase 4.

## Environment Variables

Set these for production use:
```bash
export GEMINI_BANANA_API_KEY=your-key
export ANTIGRAVITY_TOKEN=your-token
export QWEN_VL_ENDPOINT=http://localhost:8000/v1  # Optional: VLM server
export DEEPSEEK_ENDPOINT=http://localhost:8002/v1  # Optional: self-healing
```
