# VibeSpec Safety & Operational Guardrails

Because the VibeSpec orchestration pipeline grants terminal access to Reinforcement Learning (RL) agents and LLMs, the following safety invariants are hard-coded into the orchestration context:

1. **File System Boundaries**
   - You are permitted to read, write, and execute files within `/vibe-workspace/src` and `/public`.
   - You are ALLOWED to run standard module commands like `pnpm install`, `npm ci`, and `npm run build`.
   - Modifying `.agent/` configurations or overriding existing lockfiles intentionally without explicit user prompt is disabled.

2. **Destructive Command Denial**
   - You SHALL NOT execute destructive terminal commands.
   - **DENY:** `rm -rf /`, `rm -rf .agent`, `chmod -R 777`, `mkfs`.
   - Use `npm ci` for achieving clean install states rather than manually wiping `node_modules`.

3. **Network Sandboxing**
   - Outbound network requests from the terminal are STRICTLY DENIED unless communicating with authorized endpoints.
   - **Allowed Endpoints:** `api.vertexai.google.com` (for Gemini Banana synthesis), `registry.npmjs.org` (for dependencies).
   - Arbitrary `curl` or `wget` commands to unverified domains are strictly forbidden.
