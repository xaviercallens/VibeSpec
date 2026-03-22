/**
 * MicrocopyGenerator — Generates SEO-optimized titles, subtitles,
 * and localization-ready text for each screen.
 */

import type { Microcopy, LayoutManifest, UIElement } from '@vibespec/schemas';
import { BananaClient } from './banana-client.js';

export class MicrocopyGenerator {
  private client: BananaClient;

  constructor(client?: BananaClient) {
    this.client = client ?? new BananaClient();
  }

  /**
   * Generate microcopy for a single screen.
   */
  async generate(manifest: LayoutManifest): Promise<Microcopy> {
    const entries: Microcopy['entries'] = [];
    const textElements = this.collectTextElements(manifest.elements);

    // Generate page title
    entries.push({
      id: `${manifest.screenId}.title`,
      defaultText: this.inferTitle(manifest.screenId),
      context: `Page title for the ${manifest.screenId} screen`,
      seoRole: 'title',
    });

    // Generate meta description
    entries.push({
      id: `${manifest.screenId}.metaDescription`,
      defaultText: `Explore our ${manifest.screenId} page — designed for the best user experience.`,
      context: `Meta description for SEO on the ${manifest.screenId} screen`,
      seoRole: 'meta-description',
    });

    // Generate text for each text element found
    for (let i = 0; i < textElements.length; i++) {
      const el = textElements[i];
      const role = el.semanticTag === 'h1' ? 'heading' : 'body';

      entries.push({
        id: `${manifest.screenId}.text.${i}`,
        defaultText: el.label ?? `Content block ${i + 1}`,
        context: `${role} text element on ${manifest.screenId}`,
        seoRole: role as 'heading' | 'body',
      });
    }

    return {
      screenId: manifest.screenId,
      entries,
    };
  }

  /**
   * Generate microcopy for all screens.
   */
  async generateAll(manifests: LayoutManifest[]): Promise<Microcopy[]> {
    return Promise.all(manifests.map((m) => this.generate(m)));
  }

  private collectTextElements(elements: UIElement[]): UIElement[] {
    const texts: UIElement[] = [];
    for (const el of elements) {
      if (el.type === 'text' || el.semanticTag === 'h1' || el.semanticTag === 'h2' || el.semanticTag === 'p') {
        texts.push(el);
      }
      if (el.children) {
        texts.push(...this.collectTextElements(el.children));
      }
    }
    return texts;
  }

  private inferTitle(screenId: string): string {
    const words = screenId.replace(/[-_]/g, ' ').split(' ');
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
