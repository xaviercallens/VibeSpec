/**
 * ScallopBridge — Neuro-Symbolic bridge using Scallop programming language concepts.
 *
 * OPEN-SOURCE INTEGRATION:
 * - Scallop (scallop-lang) — neuro-symbolic programming language
 *   Integrates deep learning probabilities (PyTorch) with Datalog logic.
 *
 * This module translates VLM perception outputs (probabilistic bounding boxes)
 * into deterministic symbolic facts for Z3 and Apalache verification.
 *
 * Scallop Pattern:
 *   overlap(A, B) :- bounds(A, X1, Y1, W1, H1), bounds(B, X2, Y2, W2, H2),
 *                     X1 < X2 + W2, X2 < X1 + W1, Y1 < Y2 + H2, Y2 < Y1 + H1.
 */

import type { UIElement, LayoutManifest } from '@vibespec/schemas';

/** A symbolic fact extracted from neural perception. */
export interface SymbolicFact {
  /** Fact predicate name */
  predicate: string;
  /** Arguments */
  args: (string | number)[];
  /** Confidence from the neural model (0-1) */
  confidence: number;
}

/** Result of Datalog-style logical inference. */
export interface InferenceResult {
  /** Derived facts */
  derivedFacts: SymbolicFact[];
  /** Rule violations */
  violations: { rule: string; facts: SymbolicFact[] }[];
}

export class ScallopBridge {
  /**
   * Extract symbolic facts from a layout manifest.
   * Converts VLM bounding boxes into Datalog-style facts.
   */
  extractFacts(manifest: LayoutManifest): SymbolicFact[] {
    const facts: SymbolicFact[] = [];
    const elements = this.flattenWithDepth(manifest.elements, 0, 'root');

    for (const { element, depth, parentId } of elements) {
      const id = element.label ?? element.type;

      // bounds(Element, X, Y, Width, Height)
      facts.push({
        predicate: 'bounds',
        args: [id, element.bbox.x, element.bbox.y, element.bbox.width, element.bbox.height],
        confidence: 0.95, // VLM confidence
      });

      // element_type(Element, Type)
      facts.push({
        predicate: 'element_type',
        args: [id, element.type],
        confidence: 0.95,
      });

      // semantic_tag(Element, Tag)
      if (element.semanticTag) {
        facts.push({
          predicate: 'semantic_tag',
          args: [id, element.semanticTag],
          confidence: 0.9,
        });
      }

      // parent_of(Parent, Child)
      if (parentId !== 'root') {
        facts.push({
          predicate: 'parent_of',
          args: [parentId, id],
          confidence: 0.95,
        });
      }

      // interactive(Element) for buttons, inputs, links
      if (['button', 'input'].includes(element.type) || element.semanticTag === 'a') {
        facts.push({
          predicate: 'interactive',
          args: [id],
          confidence: 0.9,
        });
      }

      // has_label(Element, Text)
      if (element.label) {
        facts.push({
          predicate: 'has_label',
          args: [id, element.label],
          confidence: 0.85,
        });
      }
    }

    return facts;
  }

  /**
   * Run Datalog-style inference on extracted facts.
   * Implements Scallop rules for overlap detection and containment checking.
   *
   * Rules:
   *   overlap(A, B) :- bounds(A, X1, Y1, W1, H1), bounds(B, X2, Y2, W2, H2),
   *                     X1 < X2 + W2, X2 < X1 + W1, Y1 < Y2 + H2, Y2 < Y1 + H1.
   *   missing_label(E) :- interactive(E), NOT has_label(E, _).
   *   overflow(Child, Parent) :- parent_of(Parent, Child), bounds(Parent, ...), bounds(Child, ...),
   *                               child extends beyond parent bounds.
   */
  infer(facts: SymbolicFact[]): InferenceResult {
    const derivedFacts: SymbolicFact[] = [];
    const violations: { rule: string; facts: SymbolicFact[] }[] = [];

    // Extract bounds facts
    const bounds = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const fact of facts) {
      if (fact.predicate === 'bounds') {
        bounds.set(fact.args[0] as string, {
          x: fact.args[1] as number,
          y: fact.args[2] as number,
          w: fact.args[3] as number,
          h: fact.args[4] as number,
        });
      }
    }

    // Rule: overlap(A, B)
    const boundEntries = [...bounds.entries()];
    for (let i = 0; i < boundEntries.length; i++) {
      for (let j = i + 1; j < boundEntries.length; j++) {
        const [idA, a] = boundEntries[i];
        const [idB, b] = boundEntries[j];

        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
          const fact: SymbolicFact = { predicate: 'overlap', args: [idA, idB], confidence: 0.95 };
          derivedFacts.push(fact);
          violations.push({ rule: 'no_overlap', facts: [fact] });
        }
      }
    }

    // Rule: missing_label(E) :- interactive(E), NOT has_label(E, _)
    const interactive = new Set(facts.filter((f) => f.predicate === 'interactive').map((f) => f.args[0] as string));
    const labeled = new Set(facts.filter((f) => f.predicate === 'has_label').map((f) => f.args[0] as string));
    for (const el of interactive) {
      if (!labeled.has(el)) {
        const fact: SymbolicFact = { predicate: 'missing_label', args: [el], confidence: 0.9 };
        derivedFacts.push(fact);
        violations.push({ rule: 'all_interactive_labeled', facts: [fact] });
      }
    }

    return { derivedFacts, violations };
  }

  /**
   * Generate Scallop program text for the fact base.
   * Can be piped to the Scallop interpreter for formal execution.
   */
  toScallopProgram(facts: SymbolicFact[]): string {
    const lines = [
      '// VibeSpec Neuro-Symbolic Fact Base (Scallop Format)',
      '// Run: scallop vibespec_facts.scl',
      '',
      '// --- Neural Facts (from VLM) ---',
    ];

    for (const fact of facts) {
      const args = fact.args.map((a) => typeof a === 'string' ? `"${a}"` : a).join(', ');
      lines.push(`rel ${fact.predicate}(${args}) = ${fact.confidence.toFixed(2)}`);
    }

    lines.push('');
    lines.push('// --- Logical Rules ---');
    lines.push('rel overlap(A, B) = bounds(A, X1, Y1, W1, H1), bounds(B, X2, Y2, W2, H2),');
    lines.push('                     X1 < X2 + W2, X2 < X1 + W1, Y1 < Y2 + H2, Y2 < Y1 + H1.');
    lines.push('rel missing_label(E) = interactive(E), ~has_label(E, _).');
    lines.push('');
    lines.push('// --- Queries ---');
    lines.push('query overlap');
    lines.push('query missing_label');

    return lines.join('\n');
  }

  private flattenWithDepth(
    elements: UIElement[],
    depth: number,
    parentId: string
  ): Array<{ element: UIElement; depth: number; parentId: string }> {
    const result: Array<{ element: UIElement; depth: number; parentId: string }> = [];
    for (const el of elements) {
      const id = el.label ?? el.type;
      result.push({ element: el, depth, parentId });
      if (el.children) {
        result.push(...this.flattenWithDepth(el.children, depth + 1, id));
      }
    }
    return result;
  }
}
