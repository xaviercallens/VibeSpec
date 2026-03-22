---
description: Generate the Frontend UI and synthesize missing layout assets
---
This workflow dynamically builds the React components based on the AST parsed during the ingestion phase and utilizes the Gemini engine for visual asset creation.

1. Scaffold the Next.js `app/` router directory, mapping the XState routing logic to physical `page.tsx` boundaries.
2. Generate the React components using the validated `tailwind.config.ts` design tokens.
3. Automatically scan the generated components for visual intent placeholders (e.g., `data-intent="user_avatar"` or `data-intent="hero_image"`).
// turbo
4. Execute the `banana-synth` skill (`python .agent/skills/banana-synth/banana_synth.py`) for all identified placeholders to generate optimized WebP/SVG replacements via the Vertex AI pipeline.
// turbo
5. Inject the synthesized visual assets into the `/public/assets` directory and resolve the React image tag paths.
