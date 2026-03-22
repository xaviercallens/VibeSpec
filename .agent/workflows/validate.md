---
description: Validate a deployed application against VibeSpec constraints
---

# Validate Deployment

Run this workflow to validate a live deployment against EARS constraints and generate formal proofs.

## Steps

1. Ensure the target application is running:
   ```bash
   # Local dev server
   npm run dev  # or the Antigravity preview URL
   ```

2. Run validation:
   ```bash
   npx vibespec verify --url http://localhost:3000
   ```

3. Review results:
   - `formal_proof.tla` — TLA+ proof certificate
   - `a11y-report.json` — WCAG 2.2 AAA accessibility report
   - `proof-certificate.json` — verification summary with conclusion

4. If violations are detected:
   - The self-healing loop generates code patches automatically
   - Review patches and re-run: `npx vibespec verify --url http://localhost:3000`

## Browser-Based Validation (Production)

For real browser testing with Playwright:

```bash
# Install Playwright browsers
npx playwright install chromium

# Run with browser mode
VIBESPEC_USE_BROWSER=true npx vibespec verify --url https://preview.example.com
```
