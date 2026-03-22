/**
 * OCRExtractor — Extracts embedded text from mockup images.
 *
 * Provides a pluggable OCR backend (defaults to a simple text extraction
 * heuristic; production use should integrate Tesseract.js or Google Vision API).
 */

import { readFile } from 'node:fs/promises';
import type { ParsedFile } from '@vibespec/schemas';

/** OCR extraction result for a single file. */
export interface OCRResult {
  /** Source file path */
  filePath: string;
  /** Extracted text blocks */
  textBlocks: string[];
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * OCR backend interface. Implement this to plug in Tesseract.js, Google Vision, etc.
 */
export interface OCRBackend {
  extractText(imageBuffer: Buffer, mimeType: string): Promise<{ text: string[]; confidence: number }>;
}

/**
 * Default OCR backend: extracts ASCII text patterns from image binary data.
 * This is a placeholder — production should use Tesseract.js or Google Vision API.
 */
export class DefaultOCRBackend implements OCRBackend {
  async extractText(imageBuffer: Buffer, _mimeType: string): Promise<{ text: string[]; confidence: number }> {
    // Extract printable ASCII text runs (≥ 4 chars) from the binary data.
    // This catches text embedded in PNG tEXt/iTXt chunks and similar metadata.
    const textRuns: string[] = [];
    const str = imageBuffer.toString('latin1');
    const matches = str.match(/[\x20-\x7E]{4,}/g);

    if (matches) {
      for (const match of matches) {
        const trimmed = match.trim();
        // Filter out common binary artifacts
        if (trimmed.length >= 4 && !/^[\x00-\x1F]+$/.test(trimmed) && !trimmed.startsWith('IHDR') && !trimmed.startsWith('IDAT')) {
          textRuns.push(trimmed);
        }
      }
    }

    return { text: textRuns, confidence: 0.3 }; // Low confidence for binary extraction
  }
}

export class OCRExtractor {
  private backend: OCRBackend;

  constructor(backend?: OCRBackend) {
    this.backend = backend ?? new DefaultOCRBackend();
  }

  /**
   * Extract text from a single image file.
   */
  async extract(file: ParsedFile): Promise<OCRResult> {
    const buffer = await readFile(file.path);
    const { text, confidence } = await this.backend.extractText(buffer, file.mimeType);

    return {
      filePath: file.path,
      textBlocks: text,
      confidence,
    };
  }

  /**
   * Extract text from multiple files in batch.
   */
  async extractBatch(files: ParsedFile[]): Promise<OCRResult[]> {
    return Promise.all(files.map((f) => this.extract(f)));
  }
}
