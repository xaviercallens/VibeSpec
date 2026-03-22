# VibeSpec Architecture & Code Style Guidelines

These are the strict formatting laws that govern all generative output within the VibeSpec Antigravity Workspace.

1. **TypeScript Strictness**
   - All frontend and backend code MUST enforce `tsconfig.json` strict mode.
   - Explicit `any` types are strictly forbidden. Use `unknown` or create an interface if the shape is volatile.
   - All React component props must be statically typed. Use `interface` over `type` aliases for extensible props.

2. **Tailwind & Design System Mapping**
   - You SHALL exclusively use Tailwind CSS utility classes.
   - Do not invent arbitrary hex codes. You MUST map colors precisely to the CSS variables extracted from `stitch/DESIGN.md` (e.g., `bg-primary`, `text-secondary-foreground`).
   - Using inline CSS (`style={{...}}`) is FORBIDDEN unless computing dynamic transforms (e.g., Framer Motion properties).

3. **Accessibility (WCAG 2.2 AAA)**
   - All interactive elements (button, a, input, etc.) MUST include proper ARIA roles and keyboard tab-indexing.
   - Ensure the minimum contrast ratio is respected natively via the design token constraints.

4. **Component Hierarchy**
   - Use Next.js 14+ App Router paradigms natively (`page.tsx`, `layout.tsx`, React Server Components).
   - Segregate client logic strictly with the `"use client"` directive. Keep state as low in the tree as possible.
