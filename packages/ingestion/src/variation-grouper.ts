/**
 * VariationGrouper — Groups visual variations (hover states, dropdowns,
 * modals) that belong to the same root screen.
 *
 * Grouping heuristic: filenames sharing a common prefix up to a variant
 * suffix (e.g., "product", "product-hover", "product-dropdown") are
 * grouped under the same root screen.
 */

import { basename, extname } from 'node:path';
import type { ParsedFile, ScreenGroup } from '@vibespec/schemas';

/** Common variant suffixes that indicate a variation of a root screen. */
const VARIANT_SUFFIXES = [
  '-hover',
  '_hover',
  '-active',
  '_active',
  '-focus',
  '_focus',
  '-dropdown',
  '_dropdown',
  '-modal',
  '_modal',
  '-open',
  '_open',
  '-closed',
  '_closed',
  '-expanded',
  '_expanded',
  '-collapsed',
  '_collapsed',
  '-selected',
  '_selected',
  '-disabled',
  '_disabled',
  '-error',
  '_error',
  '-success',
  '_success',
  '-loading',
  '_loading',
  '-mobile',
  '_mobile',
  '-tablet',
  '_tablet',
  '-desktop',
  '_desktop',
];

/**
 * Strip variant suffix from a filename to get the root screen name.
 */
function getRootName(filename: string): string {
  const nameWithoutExt = basename(filename, extname(filename)).toLowerCase();

  for (const suffix of VARIANT_SUFFIXES) {
    if (nameWithoutExt.endsWith(suffix)) {
      return nameWithoutExt.slice(0, -suffix.length);
    }
  }

  // Also handle numeric suffixes like "product-2", "product_3"
  const numericMatch = nameWithoutExt.match(/^(.+?)[-_]\d+$/);
  if (numericMatch) {
    return numericMatch[1];
  }

  return nameWithoutExt;
}

/**
 * Check if a filename indicates a variant (has a known variant suffix).
 */
function isVariant(filename: string): boolean {
  const nameWithoutExt = basename(filename, extname(filename)).toLowerCase();

  for (const suffix of VARIANT_SUFFIXES) {
    if (nameWithoutExt.endsWith(suffix)) {
      return true;
    }
  }

  // Numeric suffix also indicates variant
  return /[-_]\d+$/.test(nameWithoutExt);
}

export class VariationGrouper {
  /**
   * Group parsed files into ScreenGroups.
   * Files sharing a root name are grouped; the non-variant file is the root,
   * and files with variant suffixes become variants.
   */
  group(files: ParsedFile[]): ScreenGroup[] {
    const groupMap = new Map<string, { root?: ParsedFile; variants: ParsedFile[] }>();

    for (const file of files) {
      const rootName = getRootName(file.filename);

      if (!groupMap.has(rootName)) {
        groupMap.set(rootName, { variants: [] });
      }

      const group = groupMap.get(rootName)!;

      if (isVariant(file.filename)) {
        group.variants.push(file);
      } else {
        // If root already exists, the earlier one becomes a variant
        if (group.root) {
          group.variants.push(group.root);
        }
        group.root = file;
      }
    }

    const screenGroups: ScreenGroup[] = [];

    for (const [id, group] of groupMap) {
      // If no explicit root was found, use the first file as root
      const root = group.root ?? group.variants.shift();
      if (!root) continue;

      screenGroups.push({
        id,
        root,
        variants: group.variants,
        extractedText: [], // Populated later by OCR
      });
    }

    return screenGroups;
  }
}
