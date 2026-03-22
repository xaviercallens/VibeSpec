/**
 * RouteWirer — Wires XState machines to application routing,
 * enforcing constraint-driven route guards.
 */

import type { StatechartDefinition, UserFlow, EARSConstraint } from '@vibespec/schemas';

export interface RouteGuard {
  route: string;
  guard: string;
  redirectTo: string;
  constraintId: string;
}

export class RouteWirer {
  /**
   * Generate route guard configurations from constraints and flows.
   */
  generateGuards(constraints: EARSConstraint[], flow: UserFlow): RouteGuard[] {
    const guards: RouteGuard[] = [];

    for (const constraint of constraints) {
      if (!constraint.response.includes('NOT render')) continue;

      const routeMatch = constraint.response.match(/NOT render (\/[\w-]+)/);
      if (!routeMatch) continue;

      const route = routeMatch[1];
      const redirectMatch = constraint.response.match(/redirect to (\/[\w-]+)/);
      const redirectTo = redirectMatch ? redirectMatch[1] : '/';

      guards.push({
        route,
        guard: constraint.trigger,
        redirectTo,
        constraintId: constraint.id,
      });
    }

    return guards;
  }

  /**
   * Generate a Zustand middleware that enforces XState route guards.
   */
  generateMiddleware(guards: RouteGuard[], statechart: StatechartDefinition): string {
    const guardChecks = guards.map((g) => {
      return `    // ${g.constraintId}: ${g.guard}
    if (path === '${g.route}') {
      const canAccess = checkGuard('${g.guard}', state);
      if (!canAccess) return '${g.redirectTo}';
    }`;
    });

    return [
      `/**`,
      ` * Auto-generated route guard middleware.`,
      ` * Enforces XState-driven constraints on navigation.`,
      ` */`,
      ``,
      `import { create } from 'zustand';`,
      ``,
      `interface AppState {`,
      `  cart: Set<string>;`,
      `  auth: boolean;`,
      `  currentPage: string;`,
      `}`,
      ``,
      `function checkGuard(guard: string, state: AppState): boolean {`,
      `  if (guard.includes('Cart_Items == 0')) return state.cart.size > 0;`,
      `  if (guard.includes('User_Authenticated == false')) return state.auth;`,
      `  return true;`,
      `}`,
      ``,
      `export function enforceRouteGuard(path: string, state: AppState): string | null {`,
      ...guardChecks,
      `    return null; // No redirect needed`,
      `}`,
      ``,
    ].join('\n');
  }
}
