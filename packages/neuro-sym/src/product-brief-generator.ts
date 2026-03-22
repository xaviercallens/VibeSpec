/**
 * ProductBriefGenerator — Generates structured PRODUCT-BRIEF.md
 * for each ingested screen, detailing component hierarchy,
 * responsive breakpoints, and semantic HTML5 tagging.
 */

import type { LayoutManifest, UIElement } from '@vibespec/schemas';

export class ProductBriefGenerator {
  /**
   * Generate a PRODUCT-BRIEF.md string for a single layout manifest.
   */
  generate(manifest: LayoutManifest): string {
    const lines: string[] = [];

    lines.push(`# Product Brief: ${manifest.screenId}`);
    lines.push('');
    lines.push('## Screen Overview');
    lines.push(`- **Screen ID:** ${manifest.screenId}`);
    lines.push(`- **Viewport:** ${manifest.viewport.width}×${manifest.viewport.height}`);
    lines.push(`- **Layout Strategy:** ${manifest.layoutStrategy}`);
    lines.push(`- **Schema Version:** ${manifest.version}`);
    lines.push('');

    // Breakpoints
    if (manifest.breakpoints && manifest.breakpoints.length > 0) {
      lines.push('## Responsive Breakpoints');
      for (const bp of manifest.breakpoints) {
        lines.push(`- **${bp}px** — ${this.breakpointLabel(bp)}`);
      }
      lines.push('');
    }

    // Component hierarchy
    lines.push('## Component Hierarchy');
    lines.push('');
    this.renderElementTree(manifest.elements, lines, 0);
    lines.push('');

    // Semantic HTML5 structure
    lines.push('## Semantic HTML5 Structure');
    lines.push('```html');
    this.renderHTMLStructure(manifest.elements, lines, 0);
    lines.push('```');
    lines.push('');

    // Element summary table
    lines.push('## Element Summary');
    lines.push('| Type | Label | Semantic Tag | Layout Hint |');
    lines.push('|------|-------|-------------|-------------|');
    this.flattenElements(manifest.elements).forEach((el) => {
      lines.push(
        `| ${el.type} | ${el.label ?? '—'} | \`<${el.semanticTag ?? 'div'}>\` | ${el.layoutHint ?? '—'} |`
      );
    });
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate briefs for multiple manifests.
   */
  generateAll(manifests: LayoutManifest[]): Record<string, string> {
    const briefs: Record<string, string> = {};
    for (const manifest of manifests) {
      briefs[manifest.screenId] = this.generate(manifest);
    }
    return briefs;
  }

  private breakpointLabel(px: number): string {
    if (px <= 480) return 'Mobile';
    if (px <= 768) return 'Tablet';
    if (px <= 1024) return 'Laptop';
    return 'Desktop';
  }

  private renderElementTree(elements: UIElement[], lines: string[], depth: number): void {
    const indent = '  '.repeat(depth);
    for (const el of elements) {
      const label = el.label ? ` — "${el.label}"` : '';
      const tag = el.semanticTag ? ` <${el.semanticTag}>` : '';
      lines.push(`${indent}- **${el.type}**${tag}${label}`);
      if (el.children) {
        this.renderElementTree(el.children, lines, depth + 1);
      }
    }
  }

  private renderHTMLStructure(elements: UIElement[], lines: string[], depth: number): void {
    const indent = '  '.repeat(depth);
    for (const el of elements) {
      const tag = el.semanticTag ?? 'div';
      const cls = el.layoutHint ? ` class="${el.layoutHint}"` : '';
      if (el.children && el.children.length > 0) {
        lines.push(`${indent}<${tag}${cls}>`);
        this.renderHTMLStructure(el.children, lines, depth + 1);
        lines.push(`${indent}</${tag}>`);
      } else {
        const content = el.label ? el.label : '';
        lines.push(`${indent}<${tag}${cls}>${content}</${tag}>`);
      }
    }
  }

  private flattenElements(elements: UIElement[]): UIElement[] {
    const flat: UIElement[] = [];
    for (const el of elements) {
      flat.push(el);
      if (el.children) {
        flat.push(...this.flattenElements(el.children));
      }
    }
    return flat;
  }
}
