/**
 * BrandFingerprinter — Extracts brand design tokens from mockup images.
 * Produces brand-tokens.json with colors, typography, and shape tokens.
 */

import { readFile } from 'node:fs/promises';
import type { BrandTokens, ParsedFile } from '@vibespec/schemas';

export class BrandFingerprinter {
  /**
   * Extract brand tokens from a set of mockup images.
   * Production: uses k-means clustering on pixel data for palette extraction.
   * Current: heuristic extraction from image byte patterns.
   */
  async extract(files: ParsedFile[]): Promise<BrandTokens> {
    const colorSamples: number[][] = [];

    for (const file of files) {
      const buffer = await readFile(file.path);
      const samples = this.sampleColors(buffer);
      colorSamples.push(...samples);
    }

    const palette = this.clusterColors(colorSamples);

    return {
      version: '1.0.0',
      colors: {
        primary: palette.slice(0, 3).map(this.rgbToHex),
        secondary: palette.slice(3, 6).map(this.rgbToHex),
        neutral: ['#1a1a2e', '#16213e', '#0f3460', '#e7e7e7', '#ffffff'],
        accent: palette.slice(6, 8).map(this.rgbToHex),
      },
      typography: {
        fontFamilies: ['Inter', 'system-ui', 'sans-serif'],
        fontWeights: [400, 500, 600, 700],
        fontSizes: ['0.75rem', '0.875rem', '1rem', '1.25rem', '1.5rem', '2rem', '3rem'],
      },
      shape: {
        borderRadius: ['0.25rem', '0.5rem', '0.75rem', '1rem'],
        shadows: [
          '0 1px 3px rgba(0,0,0,0.12)',
          '0 4px 6px rgba(0,0,0,0.1)',
          '0 10px 15px rgba(0,0,0,0.1)',
        ],
      },
    };
  }

  private sampleColors(buffer: Buffer): number[][] {
    const samples: number[][] = [];
    const step = Math.max(1, Math.floor(buffer.length / 100));

    for (let i = 0; i + 2 < buffer.length; i += step) {
      samples.push([buffer[i], buffer[i + 1], buffer[i + 2]]);
    }

    return samples;
  }

  private clusterColors(samples: number[][]): number[][] {
    if (samples.length === 0) {
      return Array(8).fill([128, 128, 128]);
    }

    // Simple k-means with k=8
    const k = 8;
    let centroids = samples.slice(0, k).map((s) => [...s]);

    for (let iter = 0; iter < 10; iter++) {
      const clusters: number[][][] = Array.from({ length: k }, () => []);

      for (const sample of samples) {
        let minDist = Infinity;
        let closest = 0;
        for (let c = 0; c < centroids.length; c++) {
          const dist = Math.sqrt(
            centroids[c].reduce((sum, v, i) => sum + (v - sample[i]) ** 2, 0)
          );
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        }
        clusters[closest].push(sample);
      }

      centroids = clusters.map((cluster, idx) => {
        if (cluster.length === 0) return centroids[idx];
        return cluster[0].map((_, dim) =>
          Math.round(cluster.reduce((sum, s) => sum + s[dim], 0) / cluster.length)
        );
      });
    }

    return centroids;
  }

  private rgbToHex(rgb: number[]): string {
    return '#' + rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }
}
