/**
 * AssetOptimizer — Production-grade asset optimization using open-source tools.
 *
 * OPEN-SOURCE INTEGRATION:
 * - SVG: svgo (https://github.com/svg/svgo) — industry-standard SVG optimizer
 * - Raster: sharp (https://github.com/lovell/sharp) — high-performance image processing
 *   Converts to WebP, resizes, compresses, and content-hashes assets.
 */

import { readFile, writeFile, rename } from 'node:fs/promises';
import { join, extname, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import type { GeneratedAsset } from '@vibespec/schemas';

/** SVGO config for minifying SVGs. */
const SVGO_CONFIG = {
  multipass: true,
  plugins: [
    'preset-default',
    'removeDimensions',
    { name: 'removeAttrs', params: { attrs: '(data-.*)' } },
    'sortAttrs',
    'removeXMLNS',
  ],
};

export class AssetOptimizer {
  /**
   * Optimize all assets using production open-source tools.
   * - SVGs: optimized with svgo (remove comments, collapse whitespace, minify paths)
   * - Raster images: converted to WebP via sharp (quality 80, strip metadata)
   */
  async optimizeAll(assets: GeneratedAsset[], baseDir: string): Promise<GeneratedAsset[]> {
    const optimized: GeneratedAsset[] = [];

    for (const asset of assets) {
      const fullPath = join(baseDir, asset.path);
      const buffer = await readFile(fullPath);

      let optimizedBuffer: Buffer;

      if (asset.format === 'svg') {
        optimizedBuffer = await this.optimizeSVG(buffer);
      } else if (asset.format === 'webp' || asset.format === 'png') {
        optimizedBuffer = await this.optimizeRaster(buffer);
      } else {
        optimizedBuffer = buffer;
      }

      // Write optimized content
      await writeFile(fullPath, optimizedBuffer);

      // Update content hash
      const newHash = createHash('md5').update(optimizedBuffer).digest('hex').slice(0, 8);

      optimized.push({
        ...asset,
        contentHash: newHash,
      });
    }

    return optimized;
  }

  /**
   * Optimize SVG using svgo.
   * Performs multi-pass optimization for maximum compression.
   */
  private async optimizeSVG(buffer: Buffer): Promise<Buffer> {
    try {
      const { optimize } = await import('svgo');
      const svgString = buffer.toString('utf-8');
      const result = optimize(svgString, SVGO_CONFIG as any);
      return Buffer.from(result.data);
    } catch (error) {
      // Fallback: basic minification if svgo not available
      let svg = buffer.toString('utf-8');
      svg = svg.replace(/<!--[\s\S]*?-->/g, '');
      svg = svg.replace(/\s+/g, ' ');
      svg = svg.replace(/\s>/g, '>');
      svg = svg.replace(/\s\/>/g, '/>');
      return Buffer.from(svg.trim());
    }
  }

  /**
   * Optimize raster images using sharp.
   * Converts to WebP format at quality 80 with metadata stripping.
   */
  private async optimizeRaster(buffer: Buffer): Promise<Buffer> {
    try {
      const sharp = (await import('sharp')).default;
      return await sharp(buffer)
        .webp({ quality: 80, effort: 6 })
        .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } catch (error) {
      // Fallback: return original buffer if sharp not available
      return buffer;
    }
  }

  /**
   * Generate responsive image variants for different breakpoints.
   * Uses sharp to create srcset-compatible sizes.
   */
  async generateResponsiveVariants(
    imagePath: string,
    sizes: number[] = [320, 640, 1024, 1440, 1920]
  ): Promise<{ width: number; path: string }[]> {
    const variants: { width: number; path: string }[] = [];

    try {
      const sharp = (await import('sharp')).default;
      const buffer = await readFile(imagePath);
      const dir = dirname(imagePath);
      const name = basename(imagePath, extname(imagePath));

      for (const width of sizes) {
        const variantPath = join(dir, `${name}-${width}w.webp`);
        await sharp(buffer)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(variantPath);
        variants.push({ width, path: variantPath });
      }
    } catch {
      // sharp not available
    }

    return variants;
  }
}
