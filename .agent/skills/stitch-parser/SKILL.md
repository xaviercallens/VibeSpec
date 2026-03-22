---
name: Stitch Parser
description: A deterministic script that parses Google Stitch JSON/Markdown formats into Abstract Syntax Trees (ASTs) for ingestion.
---

# Stitch Parser
Agent instructions for using this skill:
1. Always run this skill directly via terminal instead of attempting to parse large JSON files yourself.
2. The input to `stitch_parser.py` must be the extracted `.zip` directory or `DESIGN.md` file path.
3. Use the outputs directly when generating XState flows or Next.js scaffolds.
