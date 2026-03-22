/**
 * AssetFoundry — Generates icons, logos, backgrounds, and avatars
 * using Gemini Banana, maintaining brand consistency.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type { GeneratedAsset, BrandTokens } from '@vibespec/schemas';
import { BananaClient } from './banana-client.js';

export class AssetFoundry {
  private client: BananaClient;

  constructor(client?: BananaClient) {
    this.client = client ?? new BananaClient();
  }

  /**
   * Generate all assets for a set of screens.
   */
  async generateAll(
    screenIds: string[],
    brandTokens: BrandTokens,
    outputDir: string
  ): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];

    await mkdir(join(outputDir, 'icons'), { recursive: true });
    await mkdir(join(outputDir, 'images'), { recursive: true });

    for (const screenId of screenIds) {
      // Generate icon for each screen
      const icon = await this.generateIcon(screenId, brandTokens, outputDir);
      assets.push(icon);

      // Generate background image
      const bg = await this.generateBackground(screenId, brandTokens, outputDir);
      assets.push(bg);
    }

    // Generate global logo
    const logo = await this.generateLogo(brandTokens, outputDir);
    assets.push(logo);

    return assets;
  }

  private async generateIcon(
    screenId: string,
    brandTokens: BrandTokens,
    outputDir: string
  ): Promise<GeneratedAsset> {
    const response = await this.client.generate({
      prompt: `Generate a minimal icon for a "${screenId}" page`,
      outputFormat: 'svg',
      brandContext: { colors: brandTokens.colors },
    });

    const content = response.content as Buffer;
    const hash = createHash('md5').update(content).digest('hex').slice(0, 8);
    const path = `icons/${screenId}-${hash}.svg`;
    const fullPath = join(outputDir, path);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);

    return {
      id: `icon-${screenId}`,
      type: 'icon',
      path,
      format: 'svg',
      contentHash: hash,
      screenId,
    };
  }

  private async generateBackground(
    screenId: string,
    brandTokens: BrandTokens,
    outputDir: string
  ): Promise<GeneratedAsset> {
    const response = await this.client.generate({
      prompt: `Generate a background image for "${screenId}" page`,
      outputFormat: 'webp',
      brandContext: { colors: brandTokens.colors },
    });

    const content = response.content as Buffer;
    const hash = createHash('md5').update(content).digest('hex').slice(0, 8);
    const path = `images/${screenId}-bg-${hash}.webp`;

    await writeFile(join(outputDir, path), content);

    return {
      id: `bg-${screenId}`,
      type: 'background',
      path,
      format: 'webp',
      contentHash: hash,
      screenId,
    };
  }

  private async generateLogo(
    brandTokens: BrandTokens,
    outputDir: string
  ): Promise<GeneratedAsset> {
    const response = await this.client.generate({
      prompt: 'Generate a modern logo SVG',
      outputFormat: 'svg',
      brandContext: { colors: brandTokens.colors },
    });

    const content = response.content as Buffer;
    const hash = createHash('md5').update(content).digest('hex').slice(0, 8);
    const path = `icons/logo-${hash}.svg`;

    await writeFile(join(outputDir, path), content);

    return {
      id: 'logo',
      type: 'logo',
      path,
      format: 'svg',
      contentHash: hash,
      screenId: 'global',
    };
  }
}
