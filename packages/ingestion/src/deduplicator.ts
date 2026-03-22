/**
 * Deduplicator — Perceptual hashing-based image deduplication.
 *
 * Uses a difference hash (dHash) algorithm to detect visually identical
 * or near-identical screens. Two images with Hamming distance ≤ threshold
 * are considered duplicates of the same screen.
 */

import { readFile } from 'node:fs/promises';
import type { ParsedFile } from '@vibespec/schemas';

/** Default Hamming distance threshold for "same screen" classification. */
const DEFAULT_THRESHOLD = 5;

/**
 * Compute a simplified perceptual hash for an image buffer.
 * This is a difference hash (dHash) implementation that:
 * 1. Conceptually resizes to 9x8 grayscale
 * 2. Computes horizontal gradient (each pixel vs right neighbor)
 * 3. Produces a 64-bit hash
 *
 * For production, you'd use a proper image processing library (sharp).
 * This implementation works on raw pixel data concepts.
 */
function computeDHash(buffer: Buffer): string {
  // Simple hash based on byte-level patterns in the file.
  // A production version would decode the image and do actual pixel comparison.
  // For now we use a content-based hash that captures byte-level patterns.
  const sampleSize = Math.min(buffer.length, 4096);
  const bits: number[] = [];

  const step = Math.max(1, Math.floor(sampleSize / 64));
  for (let i = 0; i < 64; i++) {
    const idx = i * step;
    if (idx + step < sampleSize) {
      bits.push(buffer[idx] > buffer[idx + step] ? 1 : 0);
    } else {
      bits.push(0);
    }
  }

  // Convert bits to hex string
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += nibble.toString(16);
  }

  return hex;
}

/**
 * Compute Hamming distance between two hex hash strings.
 */
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
    // Count bits in the XOR result
    distance += ((xor >> 3) & 1) + ((xor >> 2) & 1) + ((xor >> 1) & 1) + (xor & 1);
  }

  return distance;
}

export class Deduplicator {
  private threshold: number;

  constructor(threshold: number = DEFAULT_THRESHOLD) {
    this.threshold = threshold;
  }

  /**
   * Compute the perceptual hash for an image file.
   */
  async computeHash(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    return computeDHash(buffer);
  }

  /**
   * Given a list of ParsedFiles, annotate each with its pHash
   * and return only unique files (removing duplicates).
   *
   * @returns An object with `unique` (deduplicated files) and
   *          `duplicates` (removed files with their original match).
   */
  async deduplicate(
    files: ParsedFile[]
  ): Promise<{
    unique: ParsedFile[];
    duplicates: { file: ParsedFile; matchedWith: ParsedFile }[];
  }> {
    const hashed: Array<{ file: ParsedFile; hash: string }> = [];

    // Compute hashes for all files
    for (const file of files) {
      const hash = await this.computeHash(file.path);
      hashed.push({ file: { ...file, pHash: hash }, hash });
    }

    const unique: ParsedFile[] = [];
    const duplicates: Array<{ file: ParsedFile; matchedWith: ParsedFile }> = [];
    const seen: Array<{ file: ParsedFile; hash: string }> = [];

    for (const entry of hashed) {
      let isDuplicate = false;

      for (const existing of seen) {
        if (hammingDistance(entry.hash, existing.hash) <= this.threshold) {
          duplicates.push({ file: entry.file, matchedWith: existing.file });
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(entry.file);
        seen.push(entry);
      }
    }

    return { unique, duplicates };
  }

  /**
   * Compute Hamming distance between two hashes (exposed for testing).
   */
  static hammingDistance(hash1: string, hash2: string): number {
    return hammingDistance(hash1, hash2);
  }
}
