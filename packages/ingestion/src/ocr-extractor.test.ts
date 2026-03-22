import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OCRExtractor, DefaultOCRBackend } from '../src/ocr-extractor.js';
import * as fsPromises from 'node:fs/promises';

vi.mock('node:fs/promises');

describe('OCRExtractor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('DefaultOCRBackend', () => {
    it('extracts printable ASCII text runs from binary data', async () => {
      const backend = new DefaultOCRBackend();
      
      // Construct a mock buffer with some binary noise and string patterns
      const buffer = Buffer.from('\x00\x01\x02Hello World\x03\x04IHDR\x05IDAT\x06ValidTextRuns\x07');
      
      const result = await backend.extractText(buffer, 'image/png');
      expect(result.text).toContain('Hello World');
      expect(result.text).toContain('ValidTextRuns');
      expect(result.text).not.toContain('IHDR');
      expect(result.text).not.toContain('IDAT');
      expect(result.confidence).toBe(0.3);
    });

    it('returns empty text arrays if no patterns match', async () => {
      const backend = new DefaultOCRBackend();
      const buffer = Buffer.from('\x00\x01\x02\x03');
      
      const result = await backend.extractText(buffer, 'image/png');
      expect(result.text).toHaveLength(0);
    });
  });

  describe('OCRExtractor orchestration', () => {
    it('extracts text from a single file', async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValue(Buffer.from('Extracted Data'));
      
      const extractor = new OCRExtractor();
      const result = await extractor.extract({ path: 'test.png', mimeType: 'image/png' } as any);
      
      expect(fsPromises.readFile).toHaveBeenCalledWith('test.png');
      expect(result.filePath).toBe('test.png');
      expect(result.textBlocks).toContain('Extracted Data');
    });

    it('extracts text from multiple files in batch', async () => {
      vi.mocked(fsPromises.readFile)
        .mockResolvedValueOnce(Buffer.from('Data A'))
        .mockResolvedValueOnce(Buffer.from('Data B'));
      
      const extractor = new OCRExtractor();
      const results = await extractor.extractBatch([
        { path: 'a.png', mimeType: 'image/png' },
        { path: 'b.png', mimeType: 'image/png' }
      ] as any[]);
      
      expect(results).toHaveLength(2);
      expect(results[0].textBlocks).toContain('Data A');
      expect(results[1].textBlocks).toContain('Data B');
    });
  });
});
