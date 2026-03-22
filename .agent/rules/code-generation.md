# VibeSpec Code Generation Rules

## Framework Rules

- Use Next.js 14+ App Router for all new projects
- Use React Server Components by default; client components only when needed
- Use Tailwind CSS with design tokens from `brand-tokens.json`
- Use XState v5 for state management and routing logic

## Component Rules

- Every page component MUST be wrapped in the XState route guard
- Use semantic HTML5 elements (header, nav, main, footer, article, section)
- All images MUST use the `<Image>` component with `alt` text
- All interactive elements MUST have unique `id` attributes

## Asset Rules

- SVG assets MUST be optimized via svgo before inclusion
- Raster assets MUST be converted to WebP format via sharp
- All assets MUST use content-hash filenames for cache busting

## Testing Rules

- Every constraint in `constraints.ears` MUST have a corresponding test
- The RL agent MUST achieve ≥95% interaction coverage before proof generation
- The Z3 spatial prover MUST verify no-overlap at ALL breakpoints

## Self-Healing Rules

- When a constraint violation is detected, log the exact counterexample trace
- Send the trace to DeepSeek V3.2 for autonomous code repair
- Re-verify the specific constraint after patching
- Maximum 3 healing attempts per violation before escalating to human review
