/**
 * FlowExtractor — Analyzes layout manifests to deduce user journey flows.
 *
 * Extracts a directed graph of user flows by identifying navigation elements
 * (buttons, links) and inferring page transitions from their labels.
 */

import type { LayoutManifest, UIElement, UserFlow, FlowNode, FlowEdge } from '@vibespec/schemas';

/** Common navigation label → route mappings. */
const ROUTE_MAP: Record<string, string> = {
  home: '/',
  landing: '/',
  index: '/',
  cart: '/cart',
  checkout: '/checkout',
  login: '/login',
  'sign in': '/login',
  signup: '/signup',
  'sign up': '/signup',
  register: '/register',
  profile: '/profile',
  account: '/account',
  settings: '/settings',
  search: '/search',
  catalog: '/catalog',
  products: '/products',
  product: '/product',
  about: '/about',
  contact: '/contact',
  orders: '/orders',
  'order history': '/orders',
  'order confirmation': '/order-confirmation',
  '404': '/404',
  'not found': '/404',
};

/**
 * Infer a route path from a screen ID or label.
 */
function inferRoute(label: string): string {
  const normalized = label.toLowerCase().trim();
  return ROUTE_MAP[normalized] ?? `/${normalized.replace(/\s+/g, '-')}`;
}

/**
 * Collect all interactive elements (buttons, links) from a UI tree.
 */
function collectInteractiveElements(elements: UIElement[]): UIElement[] {
  const interactive: UIElement[] = [];

  for (const el of elements) {
    if (el.type === 'button' || el.semanticTag === 'a' || el.semanticTag === 'button') {
      interactive.push(el);
    }
    if (el.children) {
      interactive.push(...collectInteractiveElements(el.children));
    }
  }

  return interactive;
}

export class FlowExtractor {
  /**
   * Extract a user flow graph from multiple layout manifests.
   * Each manifest represents a screen/page; interactive elements
   * create edges to their target pages.
   */
  extract(manifests: LayoutManifest[]): UserFlow {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    const nodeIds = new Set<string>();

    // Create a node for each screen
    for (const manifest of manifests) {
      const node: FlowNode = {
        id: manifest.screenId,
        label: manifest.screenId.charAt(0).toUpperCase() + manifest.screenId.slice(1),
        route: inferRoute(manifest.screenId),
      };
      nodes.push(node);
      nodeIds.add(manifest.screenId);
    }

    // Analyze interactive elements to create edges
    for (const manifest of manifests) {
      const interactive = collectInteractiveElements(manifest.elements);

      for (const el of interactive) {
        if (!el.label) continue;

        const targetLabel = el.label.toLowerCase().trim();
        const targetId = targetLabel.replace(/\s+/g, '-');

        // Check if the target matches any known screen
        const matchedNode = nodes.find(
          (n) =>
            n.id === targetId ||
            n.label.toLowerCase() === targetLabel ||
            n.route === inferRoute(targetLabel)
        );

        if (matchedNode && matchedNode.id !== manifest.screenId) {
          edges.push({
            from: manifest.screenId,
            to: matchedNode.id,
            action: `click:${el.label}`,
          });
        }
      }
    }

    return {
      version: '1.0.0',
      nodes,
      edges,
    };
  }
}
