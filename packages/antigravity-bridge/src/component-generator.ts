/**
 * ComponentGenerator — Generates React/Next.js component code from product briefs.
 */

import type { LayoutManifest, UIElement, BrandTokens } from '@vibespec/schemas';

export class ComponentGenerator {
  /**
   * Generate a React component from a layout manifest.
   */
  generateComponent(manifest: LayoutManifest, brandTokens: BrandTokens): string {
    const componentName = this.pascalCase(manifest.screenId);
    const imports: string[] = [];
    const jsxLines: string[] = [];

    // Generate JSX from element tree
    this.renderElement(manifest.elements, jsxLines, 2);

    return [
      `'use client';`,
      ``,
      `import React from 'react';`,
      ...imports,
      ``,
      `export default function ${componentName}Page() {`,
      `  return (`,
      `    <div className="${manifest.layoutStrategy}-layout">`,
      ...jsxLines,
      `    </div>`,
      `  );`,
      `}`,
      ``,
    ].join('\n');
  }

  /**
   * Generate a Next.js App Router page file.
   */
  generatePage(manifest: LayoutManifest, brandTokens: BrandTokens, route: string): { path: string; content: string } {
    const routePath = route === '/' ? '' : route;
    const pagePath = `src/app${routePath}/page.tsx`;
    const content = this.generateComponent(manifest, brandTokens);

    return { path: pagePath, content };
  }

  private renderElement(elements: UIElement[], lines: string[], indent: number): void {
    const pad = ' '.repeat(indent);
    for (const el of elements) {
      const tag = el.semanticTag ?? 'div';
      const className = el.layoutHint ? ` className="${el.layoutHint}"` : '';

      if (el.children && el.children.length > 0) {
        lines.push(`${pad}<${tag}${className}>`);
        this.renderElement(el.children, lines, indent + 2);
        lines.push(`${pad}</${tag}>`);
      } else {
        const content = el.label ?? '';
        lines.push(`${pad}<${tag}${className}>${content}</${tag}>`);
      }
    }
  }

  private pascalCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^(\w)/, (_, c) => c.toUpperCase());
  }
}
