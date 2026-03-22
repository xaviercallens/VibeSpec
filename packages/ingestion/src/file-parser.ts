/**
 * FileParser — Recursive file-parsing daemon that accepts .zip archives,
 * nested directories, or standalone visual files (PNG, JPG, WebP).
 */

import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import type { ParsedFile } from '@vibespec/schemas';

/** Supported image MIME types for ingestion. */
const SUPPORTED_EXTENSIONS: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/** Check if a file extension is a supported image format. */
function isSupportedImage(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext in SUPPORTED_EXTENSIONS;
}

/** Get MIME type from file extension. */
function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS[ext] ?? 'application/octet-stream';
}

/**
 * FileParser handles recursive traversal of directories and extraction
 * of .zip archives, returning a flat list of ParsedFile entries.
 */
export class FileParser {
  private skippedFiles: string[] = [];

  /**
   * Parse a path (file or directory) and return all supported image files.
   * @param inputPath - Path to a file, directory, or .zip archive.
   * @returns Array of ParsedFile entries.
   */
  async parse(inputPath: string): Promise<ParsedFile[]> {
    this.skippedFiles = [];
    const stats = await stat(inputPath);

    if (stats.isDirectory()) {
      return this.parseDirectory(inputPath);
    }

    if (stats.isFile()) {
      const ext = extname(inputPath).toLowerCase();

      if (ext === '.zip') {
        return this.parseZip(inputPath);
      }

      if (isSupportedImage(inputPath)) {
        return [await this.fileToEntry(inputPath, stats.size)];
      }

      this.skippedFiles.push(inputPath);
      return [];
    }

    return [];
  }

  /**
   * Recursively traverse a directory and collect all supported image files.
   */
  async parseDirectory(dirPath: string): Promise<ParsedFile[]> {
    const results: ParsedFile[] = [];
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const nested = await this.parseDirectory(fullPath);
        results.push(...nested);
      } else if (entry.isFile()) {
        if (isSupportedImage(fullPath)) {
          const stats = await stat(fullPath);
          results.push(await this.fileToEntry(fullPath, stats.size));
        } else {
          this.skippedFiles.push(fullPath);
        }
      }
    }

    return results;
  }

  /**
   * Extract and parse a .zip archive.
   * Uses dynamic import to handle the 'yauzl' or built-in zip extraction.
   */
  async parseZip(zipPath: string): Promise<ParsedFile[]> {
    // For the initial implementation, we extract to a temp dir and then parse.
    // A production implementation would stream entries from the zip.
    const { tmpdir } = await import('node:os');
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileAsync = promisify(execFile);

    const tempDir = await mkdtemp(join(tmpdir(), 'vibespec-'));

    try {
      // Extract zip to temp directory
      await execFileAsync('unzip', ['-o', '-q', zipPath, '-d', tempDir]);
      return await this.parseDirectory(tempDir);
    } catch (error) {
      // If unzip fails (e.g., empty zip), return empty
      console.warn(`Failed to extract zip ${zipPath}:`, error);
      return [];
    }
  }

  /**
   * Convert a file path to a ParsedFile entry.
   */
  private async fileToEntry(filePath: string, sizeBytes: number): Promise<ParsedFile> {
    return {
      filename: basename(filePath),
      path: filePath,
      mimeType: getMimeType(filePath),
      sizeBytes,
    };
  }

  /** Get the list of files that were skipped (unsupported format). */
  getSkippedFiles(): string[] {
    return [...this.skippedFiles];
  }
}
