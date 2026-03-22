---
description: Import a Google Stitch project and run the full VibeSpec pipeline
---
This workflow handles the ingestion and parsing phase of a Google Stitch export, converting raw design data into actionable ASTs and machine configurations.

1. Unzip the Google Stitch export to the temporary `/workspace/.stitch-raw/` directory.
// turbo
2. Execute the `stitch-parser` skill (`python .agent/skills/stitch-parser/stitch_parser.py --input /workspace/.stitch-raw/DESIGN.md`) to generate a strict, schema-validated `tailwind.config.ts`.
// turbo
3. Parse the Stitch `flow.json` artifact using the Logic-Mapper logic.
// turbo
4. Generate the XState routing map (`app-machine.ts`) based on the structural flow to ensure mathematically verifiable transition states.
