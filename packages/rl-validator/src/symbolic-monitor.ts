/**
 * SymbolicMonitor — Real-time constraint verification engine.
 *
 * Monitors application state changes and cross-references them
 * against EARS constraints to detect violations.
 */

import type { EARSConstraint, ConstraintViolation } from '@vibespec/schemas';

export class SymbolicMonitor {
  private constraints: EARSConstraint[];
  private violations: ConstraintViolation[] = [];

  constructor(constraints: EARSConstraint[]) {
    this.constraints = constraints;
  }

  /**
   * Check a state snapshot against all constraints.
   * Returns any violations found.
   */
  check(state: Record<string, unknown>, action: string): ConstraintViolation[] {
    const newViolations: ConstraintViolation[] = [];

    for (const constraint of this.constraints) {
      if (!this.evaluateConstraint(constraint, state)) {
        const violation: ConstraintViolation = {
          constraintId: constraint.id,
          constraintText: constraint.fullText,
          stateSnapshot: { ...state },
          triggerAction: action,
          domTrace: JSON.stringify(state),
          timestamp: new Date().toISOString(),
        };
        newViolations.push(violation);
        this.violations.push(violation);
      }
    }

    return newViolations;
  }

  /** Get all violations detected so far. */
  getAllViolations(): ConstraintViolation[] {
    return [...this.violations];
  }

  /** Get violation count. */
  getViolationCount(): number {
    return this.violations.length;
  }

  /**
   * Evaluate a single constraint against a state.
   * Returns true if the constraint holds, false if violated.
   */
  private evaluateConstraint(constraint: EARSConstraint, state: Record<string, unknown>): boolean {
    const currentPage = state['currentPage'] as string | undefined;

    // Check cart-related constraints
    if (constraint.trigger.includes('Cart_Items == 0') && constraint.response.includes('NOT render')) {
      const routeMatch = constraint.response.match(/NOT render (\/[\w-]+)/);
      if (routeMatch) {
        const protectedRoute = routeMatch[1];
        const cart = state['cart'] as unknown[] | Set<unknown> | undefined;
        const cartEmpty = !cart || (Array.isArray(cart) ? cart.length === 0 : (cart instanceof Set ? cart.size === 0 : true));

        if (currentPage === protectedRoute && cartEmpty) {
          return false; // Violation: on protected page with empty cart
        }
      }
    }

    // Check auth-related constraints
    if (constraint.trigger.includes('User_Authenticated == false') && constraint.response.includes('NOT render')) {
      const routeMatch = constraint.response.match(/NOT render (\/[\w-]+)/);
      if (routeMatch) {
        const protectedRoute = routeMatch[1];
        const auth = state['auth'] as boolean | undefined;

        if (currentPage === protectedRoute && !auth) {
          return false; // Violation: on protected page without auth
        }
      }
    }

    return true; // Constraint holds
  }
}
