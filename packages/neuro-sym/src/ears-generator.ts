/**
 * EARSGenerator — Generates EARS (Easy Approach to Requirements Syntax) constraints
 * from user flow graphs and layout manifests.
 *
 * EARS Pattern: "WHEN [trigger], THE [system] SHALL [response]"
 */

import type { UserFlow, EARSConstraint } from '@vibespec/schemas';

export class EARSGenerator {
  private counter = 0;

  /**
   * Generate EARS constraints from a user flow graph.
   * Produces navigation constraints, guard constraints, and reachability constraints.
   */
  generate(flow: UserFlow): EARSConstraint[] {
    this.counter = 0;
    const constraints: EARSConstraint[] = [];

    // Navigation constraints: each edge generates a constraint
    for (const edge of flow.edges) {
      const sourceNode = flow.nodes.find((n) => n.id === edge.from);
      const targetNode = flow.nodes.find((n) => n.id === edge.to);
      if (!sourceNode || !targetNode) continue;

      constraints.push(this.makeConstraint(
        `User performs "${edge.action}" on ${sourceNode.label}`,
        'NavigationRouter',
        `navigate to ${targetNode.route} and render ${targetNode.label} page`,
        [sourceNode.id, targetNode.id]
      ));

      // Guard constraint (if guard is specified)
      if (edge.guard) {
        constraints.push(this.makeConstraint(
          `Guard "${edge.guard}" is not satisfied`,
          'NavigationRouter',
          `NOT render ${targetNode.route} and SHALL redirect to a safe fallback page`,
          [sourceNode.id, targetNode.id]
        ));
      }
    }

    // Access control constraints for protected pages
    const protectedPages = ['checkout', 'profile', 'account', 'settings', 'orders'];
    for (const node of flow.nodes) {
      const isProtected = protectedPages.some((p) => node.id.toLowerCase().includes(p));
      if (isProtected) {
        if (node.id.toLowerCase().includes('checkout')) {
          constraints.push(this.makeConstraint(
            `State(Cart_Items == 0)`,
            'NavigationRouter',
            `NOT render ${node.route}`,
            [node.id]
          ));
        }
        if (['profile', 'account', 'settings', 'orders'].some((p) => node.id.toLowerCase().includes(p))) {
          constraints.push(this.makeConstraint(
            `State(User_Authenticated == false)`,
            'NavigationRouter',
            `NOT render ${node.route} and SHALL redirect to /login`,
            [node.id]
          ));
        }
      }
    }

    return constraints;
  }

  /**
   * Serialize constraints to EARS text format.
   */
  toEARSText(constraints: EARSConstraint[]): string {
    const lines = [
      '# EARS Constraints',
      `# Generated: ${new Date().toISOString()}`,
      `# Total: ${constraints.length} constraints`,
      '',
    ];

    for (const c of constraints) {
      lines.push(`## ${c.id}`);
      lines.push(c.fullText);
      lines.push(`Related states: ${c.relatedStates.join(', ')}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private makeConstraint(
    trigger: string,
    system: string,
    response: string,
    relatedStates: string[]
  ): EARSConstraint {
    const id = `C${String(++this.counter).padStart(3, '0')}`;
    return {
      id,
      trigger,
      system,
      response,
      fullText: `WHEN ${trigger}, THE ${system} SHALL ${response}.`,
      relatedStates,
    };
  }
}
