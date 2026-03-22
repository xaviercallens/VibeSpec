/**
 * IngestAgent — Top-level orchestrator for the Multimodal Ingestion Engine.
 *
 * Wires together FileParser → Deduplicator → OCRExtractor → VariationGrouper → VLMMapper
 * to produce the final ScreenGroup[] with populated layout manifests.
 */

import type { ScreenGroup, LayoutManifest } from '@vibespec/schemas';
import { FileParser } from './file-parser.js';
import { Deduplicator } from './deduplicator.js';
import { OCRExtractor } from './ocr-extractor.js';
import { VariationGrouper } from './variation-grouper.js';
import { VLMMapper } from './vlm-mapper.js';
import type { OCRBackend } from './ocr-extractor.js';
import type { VLMBackend } from './vlm-mapper.js';

/** Configuration for the IngestAgent. */
export interface IngestConfig {
  /** Hamming distance threshold for dedup (default: 5) */
  dedupThreshold?: number;
  /** Custom OCR backend */
  ocrBackend?: OCRBackend;
  /** Custom VLM backend */
  vlmBackend?: VLMBackend;
}

/** Result of the full ingestion pipeline. */
export interface IngestResult {
  /** Grouped, deduplicated screens with OCR text */
  screens: ScreenGroup[];
  /** Layout manifests (one per screen) */
  manifests: LayoutManifest[];
  /** Summary statistics */
  stats: {
    totalFilesFound: number;
    duplicatesRemoved: number;
    unsupportedSkipped: number;
    screenGroupsCreated: number;
  };
}

export class IngestAgent {
  private parser: FileParser;
  private dedup: Deduplicator;
  private ocr: OCRExtractor;
  private grouper: VariationGrouper;
  private vlm: VLMMapper;

  constructor(config: IngestConfig = {}) {
    this.parser = new FileParser();
    this.dedup = new Deduplicator(config.dedupThreshold);
    this.ocr = new OCRExtractor(config.ocrBackend);
    this.grouper = new VariationGrouper();
    this.vlm = new VLMMapper(config.vlmBackend);
  }

  /**
   * Run the full ingestion pipeline.
   *
   * @param inputPath - Path to a .zip archive, directory, or single image file.
   * @returns IngestResult with screens, manifests, and statistics.
   */
  async ingest(inputPath: string): Promise<IngestResult> {
    // Step 1: Parse files
    const allFiles = await this.parser.parse(inputPath);
    const skipped = this.parser.getSkippedFiles();

    if (allFiles.length === 0) {
      throw new Error('No valid mockup files found in the provided input.');
    }

    // Step 2: Deduplicate
    const { unique, duplicates } = await this.dedup.deduplicate(allFiles);

    // Step 3: Group variations
    const groups = this.grouper.group(unique);

    // Step 4: OCR extraction for each group's root + variants
    for (const group of groups) {
      const allGroupFiles = [group.root, ...group.variants];
      const ocrResults = await this.ocr.extractBatch(allGroupFiles);

      // Merge all extracted text into the group
      const allText = new Set<string>();
      for (const result of ocrResults) {
        for (const text of result.textBlocks) {
          allText.add(text);
        }
      }
      group.extractedText = [...allText];
    }

    // Step 5: VLM perception mapping
    const manifests = await this.vlm.mapAll(groups);

    return {
      screens: groups,
      manifests,
      stats: {
        totalFilesFound: allFiles.length + skipped.length,
        duplicatesRemoved: duplicates.length,
        unsupportedSkipped: skipped.length,
        screenGroupsCreated: groups.length,
      },
    };
  }
}
