/**
 * DesignTokenEngine — Converts Stitch DESIGN.md tokens into:
 * 1. tailwind.config.ts (exact design system)
 * 2. Algebraic constraints for Z3 SMT solver
 *
 * The tokens become the "mathematical law" for the NSVE.
 * Instead of VLM estimation, the Z3 prover uses exact design values.
 *
 * Example: If DESIGN.md says `--spacing-md: 16px`, the engine generates:
 *   Z3 constraint: `(assert (= spacing_header_to_hero 16))`
 *   Tailwind: `spacing: { md: '16px' }`
 */

import type { StitchDesignTokens } from './stitch-parser.js';

/** Algebraic constraint for Z3 spatial proofs. */
export interface DesignConstraint {
  /** Human-readable constraint ID */
  id: string;
  /** EARS-style text */
  description: string;
  /** Token name (e.g., "spacing-md") */
  tokenName: string;
  /** Exact value from DESIGN.md */
  exactValue: string;
  /** SMT-LIB2 assertion */
  smtAssertion: string;
}

export class DesignTokenEngine {
  /**
   * Generate tailwind.config.ts content from Stitch design tokens.
   */
  generateTailwindConfig(tokens: StitchDesignTokens): string {
    const config = {
      content: ['./src/**/*.{ts,tsx,html}'],
      theme: {
        extend: {
          colors: tokens.colors,
          fontFamily: {
            sans: tokens.typography.fontFamily,
          },
          fontSize: tokens.typography.fontSizes,
          spacing: tokens.spacing,
          borderRadius: tokens.borderRadius,
          boxShadow: tokens.shadows,
          zIndex: Object.fromEntries(
            Object.entries(tokens.zIndex).map(([k, v]) => [k, String(v)])
          ),
          screens: Object.fromEntries(
            Object.entries(tokens.breakpoints).map(([k, v]) => [k, `${v}px`])
          ),
        },
      },
    };

    return [
      `import type { Config } from 'tailwindcss';`,
      ``,
      `// Auto-generated from Google Stitch DESIGN.md`,
      `// DO NOT EDIT — regenerate via VibeSpec pipeline`,
      `const config: Config = ${JSON.stringify(config, null, 2)};`,
      ``,
      `export default config;`,
    ].join('\n');
  }

  /**
   * Generate algebraic constraints for Z3 SMT solver.
   * These are the "mathematical laws" derived from DESIGN.md.
   */
  generateConstraints(tokens: StitchDesignTokens): DesignConstraint[] {
    const constraints: DesignConstraint[] = [];
    let id = 1;

    // Spacing constraints: exact pixel values must be maintained
    for (const [name, value] of Object.entries(tokens.spacing)) {
      const px = this.parsePxValue(value);
      if (px !== null) {
        constraints.push({
          id: `DT${String(id++).padStart(3, '0')}`,
          description: `The spacing "${name}" SHALL equal exactly ${value} across all breakpoints.`,
          tokenName: `spacing-${name}`,
          exactValue: value,
          smtAssertion: `(assert (= spacing_${name} ${px}))`,
        });
      }
    }

    // Z-index constraints: no inversions
    const zEntries = Object.entries(tokens.zIndex).sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < zEntries.length - 1; i++) {
      const [nameA, valA] = zEntries[i];
      const [nameB, valB] = zEntries[i + 1];
      constraints.push({
        id: `DT${String(id++).padStart(3, '0')}`,
        description: `The z-index of "${nameB}" (${valB}) SHALL be greater than "${nameA}" (${valA}).`,
        tokenName: `z-order-${nameA}-${nameB}`,
        exactValue: `${valA} < ${valB}`,
        smtAssertion: `(assert (< z_${nameA} z_${nameB}))`,
      });
    }

    // Color contrast constraints (WCAG AAA)
    if (tokens.colors['text'] && tokens.colors['background']) {
      constraints.push({
        id: `DT${String(id++).padStart(3, '0')}`,
        description: `Text color on background SHALL maintain WCAG 2.2 AAA contrast ratio ≥ 7:1.`,
        tokenName: 'contrast-text-bg',
        exactValue: `contrast(${tokens.colors['text']}, ${tokens.colors['background']}) >= 7.0`,
        smtAssertion: `(assert (>= (contrast text_luminance bg_luminance) 7.0))`,
      });
    }

    // Border radius constraints
    for (const [name, value] of Object.entries(tokens.borderRadius)) {
      const px = this.parsePxValue(value);
      if (px !== null) {
        constraints.push({
          id: `DT${String(id++).padStart(3, '0')}`,
          description: `Border radius "${name}" SHALL equal exactly ${value}.`,
          tokenName: `radius-${name}`,
          exactValue: value,
          smtAssertion: `(assert (= radius_${name} ${px}))`,
        });
      }
    }

    return constraints;
  }

  /**
   * Generate SMT-LIB2 specification from design tokens.
   * Can be piped to Z3: `z3 -smt2 design-tokens.smt2`
   */
  toSMTLIB(tokens: StitchDesignTokens): string {
    const constraints = this.generateConstraints(tokens);
    const lines = [
      '; VibeSpec Design Token Constraints — SMT-LIB2',
      '; Source: Google Stitch DESIGN.md (ground truth)',
      '; Solver: Z3 (z3 -smt2 design-tokens.smt2)',
      '(set-logic QF_LRA)',
      '',
    ];

    // Declare spacing variables
    for (const [name, value] of Object.entries(tokens.spacing)) {
      const px = this.parsePxValue(value);
      if (px !== null) {
        lines.push(`(declare-const spacing_${name} Real)`);
        lines.push(`(assert (= spacing_${name} ${px}))`);
      }
    }
    lines.push('');

    // Declare z-index variables
    for (const [name, val] of Object.entries(tokens.zIndex)) {
      lines.push(`(declare-const z_${name} Int)`);
      lines.push(`(assert (= z_${name} ${val}))`);
    }
    lines.push('');

    // Add all constraints
    for (const c of constraints) {
      lines.push(`; ${c.id}: ${c.description}`);
      lines.push(c.smtAssertion);
    }

    lines.push('');
    lines.push('(check-sat)');
    lines.push('(get-model)');

    return lines.join('\n');
  }

  private parsePxValue(value: string): number | null {
    const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
    if (pxMatch) return parseFloat(pxMatch[1]);

    const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
    if (remMatch) return parseFloat(remMatch[1]) * 16; // 1rem = 16px

    return null;
  }
}
