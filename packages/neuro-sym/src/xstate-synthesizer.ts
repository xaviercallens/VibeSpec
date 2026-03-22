/**
 * XStateSynthesizer — Generates XState v5-compatible state machine definitions
 * from user flow graphs.
 *
 * Each flow graph becomes a state machine where:
 * - Nodes → States
 * - Edges → Transitions (with optional guards)
 */

import type { UserFlow, StatechartDefinition } from '@vibespec/schemas';

export class XStateSynthesizer {
  /**
   * Synthesize an XState machine definition from a user flow graph.
   */
  synthesize(flow: UserFlow): StatechartDefinition {
    if (flow.nodes.length === 0) {
      throw new Error('Cannot synthesize state machine from empty flow graph.');
    }

    const states: Record<string, unknown> = {};
    const initialState = flow.nodes[0].id;

    // Create states from nodes
    for (const node of flow.nodes) {
      const nodeTransitions: Record<string, unknown> = {};

      // Find all edges leaving this node
      const outgoingEdges = flow.edges.filter((e) => e.from === node.id);

      for (const edge of outgoingEdges) {
        const eventName = this.sanitizeEventName(edge.action);
        const transition: Record<string, unknown> = { target: edge.to };

        if (edge.guard) {
          transition.guard = edge.guard;
        }

        nodeTransitions[eventName] = transition;
      }

      states[node.id] = {
        on: nodeTransitions,
        meta: {
          label: node.label,
          route: node.route,
        },
      };
    }

    const machine: Record<string, unknown> = {
      id: `flow-${initialState}`,
      initial: initialState,
      states,
    };

    return {
      id: `flow-${initialState}`,
      version: '1.0.0',
      machine,
    };
  }

  /**
   * Synthesize multiple flows.
   */
  synthesizeAll(flows: UserFlow[]): StatechartDefinition[] {
    return flows.map((f) => this.synthesize(f));
  }

  /**
   * Sanitize an action label into a valid XState event name.
   * e.g., "click:Sign In" → "CLICK_SIGN_IN"
   */
  private sanitizeEventName(action: string): string {
    return action
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
