/**
 * TLAGenerator — Generates TLA+ formal invariant specifications
 * from EARS constraints and user flows.
 *
 * Produces:
 * - Safety invariants (□φ — "always φ")
 * - Liveness properties (◇φ — "eventually φ")
 * - Reachability constraints
 */

import type { UserFlow, EARSConstraint, TLAInvariant } from '@vibespec/schemas';

export class TLAGenerator {
  /**
   * Generate TLA+ invariants from EARS constraints and a user flow.
   */
  generateInvariants(constraints: EARSConstraint[], flow: UserFlow): TLAInvariant[] {
    const invariants: TLAInvariant[] = [];

    // Generate safety invariants from EARS constraints
    for (const constraint of constraints) {
      if (constraint.response.includes('NOT render')) {
        // This is a "shall not" constraint → safety invariant
        const routeMatch = constraint.response.match(/NOT render (\/[\w-]+)/);
        const route = routeMatch ? routeMatch[1] : '/unknown';

        let formula: string;
        if (constraint.trigger.includes('Cart_Items == 0')) {
          formula = `Invariant_${this.sanitizeName(constraint.id)} ==\n    currentPage = "${route}" => appState.cart /= {}`;
        } else if (constraint.trigger.includes('User_Authenticated == false')) {
          formula = `Invariant_${this.sanitizeName(constraint.id)} ==\n    currentPage = "${route}" => appState.auth = TRUE`;
        } else {
          formula = `Invariant_${this.sanitizeName(constraint.id)} ==\n    \\* ${constraint.fullText}\n    TRUE \\* TODO: formalize this constraint`;
        }

        invariants.push({
          name: `Invariant_${this.sanitizeName(constraint.id)}`,
          description: constraint.fullText,
          formula,
          constraintIds: [constraint.id],
        });
      }
    }

    // Generate reachability invariants
    for (const node of flow.nodes) {
      invariants.push({
        name: `Reachable_${this.sanitizeName(node.id)}`,
        description: `Page ${node.route} is reachable from the initial state.`,
        formula: `Reachable_${this.sanitizeName(node.id)} ==\n    \\E trace \\in Traces : "${node.route}" \\in Range(trace)`,
        constraintIds: [],
      });
    }

    return invariants;
  }

  /**
   * Generate a full TLA+ specification file.
   */
  generateSpec(
    invariants: TLAInvariant[],
    flow: UserFlow
  ): string {
    const pages = flow.nodes.map((n) => `"${n.route}"`).join(', ');

    const lines = [
      `------------------------------ MODULE VibeSpec ------------------------------`,
      ``,
      `EXTENDS Naturals, Sequences, FiniteSets`,
      ``,
      `CONSTANTS`,
      `    Pages,          \\* Set of all page routes`,
      `    Actions,        \\* Set of all user actions`,
      `    Guards          \\* Map: (Page, Action) -> Boolean precondition`,
      ``,
      `VARIABLES`,
      `    currentPage,    \\* Current active route`,
      `    appState,       \\* Application state record (cart, auth, etc.)`,
      `    history         \\* Navigation history stack`,
      ``,
      `vars == <<currentPage, appState, history>>`,
      ``,
      `---------------------------------------------------------------------------`,
      ``,
      `Init ==`,
      `    /\\ currentPage = "/"`,
      `    /\\ appState = [cart |-> {}, auth |-> FALSE, user |-> NULL]`,
      `    /\\ history = <<>>`,
      ``,
      `Navigate(target, action) ==`,
      `    /\\ Guards[currentPage, action]`,
      `    /\\ currentPage' = target`,
      `    /\\ history' = Append(history, currentPage)`,
      `    /\\ UNCHANGED appState`,
      ``,
      `Next ==`,
      `    \\E p \\in Pages, a \\in Actions : Navigate(p, a)`,
      ``,
      `---------------------------------------------------------------------------`,
      `\\* INVARIANTS (Safety Properties)`,
      ``,
    ];

    // Add invariant definitions
    for (const inv of invariants) {
      lines.push(inv.formula);
      lines.push('');
    }

    // Specification theorem
    lines.push(`---------------------------------------------------------------------------`);
    lines.push(`Spec == Init /\\ [][Next]_vars`);
    lines.push(`         /\\ WF_vars(Next)`);
    lines.push('');

    // Theorems
    for (const inv of invariants) {
      if (inv.name.startsWith('Invariant_')) {
        lines.push(`THEOREM Spec => [](${inv.name})`);
      }
    }
    lines.push('');
    lines.push(`===========================================================================`);

    return lines.join('\n');
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^A-Za-z0-9_]/g, '_');
  }
}
