import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Deduplicator } from '../src/deduplicator.js';
import * as fsPromises from 'node:fs/promises';

vi.mock('node:fs/promises');

describe('Deduplicator', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Hamming Distance', () => {
    it('computes distance correctly for identical hashes', () => {
      const distance = Deduplicator.hammingDistance('abcd', 'abcd');
      expect(distance).toBe(0);
    });

    it('computes distance correctly for different hashes', () => {
      // 'a' = 1010, 'b' = 1011 -> 1 bit difference
      const distance = Deduplicator.hammingDistance('a', 'b');
      expect(distance).toBe(1);
    });

    it('returns Infinity for mismatched lengths', () => {
      const distance = Deduplicator.hammingDistance('a', 'ab');
      expect(distance).toBe(Infinity);
    });
  });

  describe('Compute Hash', () => {
    it('computes a 64-bit dHash from an image buffer', async () => {
      // Construct a predictable buffer: 64 bytes where each is smaller than the next
      const buffer = Buffer.alloc(64);
      for (let i = 0; i < 64; i++) {
        buffer[i] = i; // Next is always larger, so buffer[idx] > buffer[idx+step] is false (0)
      }
      vi.mocked(fsPromises.readFile).mockResolvedValue(buffer);
      
      const dedup = new Deduplicator();
      const hash = await dedup.computeHash('test.png');
      
      expect(fsPromises.readFile).toHaveBeenCalledWith('test.png');
      expect(hash).toHaveLength(16); // 64 bits = 16 hex chars
      expect(hash).toBe('0000000000000000');
    });

    it('computes a hash with 1s when previous bytes are larger', async () => {
      const buffer = Buffer.alloc(64);
      for (let i = 0; i < 64; i++) {
        buffer[i] = 64 - i; // Next is always smaller, so buffer[idx] > buffer[idx+step] is true (1)
      }
      vi.mocked(fsPromises.readFile).mockResolvedValue(buffer);
      
      const dedup = new Deduplicator();
      const hash = await dedup.computeHash('test.png');
      
      // All 1s except the last padding bit = ffff...e
      expect(hash).toBe('fffffffffffffffe');
    });
  });

  describe('Deduplicate', () => {
    it('removes duplicates based on threshold', async () => {
      // Create buffers that will yield specific hashes
      const bufferA = Buffer.alloc(64); // hash: 000...
      
      // bufferA_Variant will be identical so distance = 0
      const bufferAVariant = Buffer.alloc(64);
      
      // bufferB will be opposite, yielding ffff... so distance = 64
      const bufferB = Buffer.alloc(64);
      for (let i = 0; i < 64; i++) bufferB[i] = 64 - i;
      
      vi.mocked(fsPromises.readFile)
        .mockResolvedValueOnce(bufferA)
        .mockResolvedValueOnce(bufferAVariant)
        .mockResolvedValueOnce(bufferB);
      
      const dedup = new Deduplicator(5); // threshold 5
      const files = [
        { path: 'a.png', filename: 'a.png' },
        { path: 'a_copy.png', filename: 'a_copy.png' },
        { path: 'b.png', filename: 'b.png' }
      ] as any[];

      const { unique, duplicates } = await dedup.deduplicate(files);

      expect(unique).toHaveLength(2);
      expect(unique[0].filename).toBe('a.png');
      expect(unique[1].filename).toBe('b.png');

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].file.filename).toBe('a_copy.png');
      expect(duplicates[0].matchedWith.filename).toBe('a.png');
    });

    it('keeps images that fall just outside the threshold', async () => {
      // Base: all 0s = 000...
      const bufferA = Buffer.alloc(64); 
      for (let i = 0; i < 64; i++) bufferA[i] = i;
      
      // Variant: differs heavily, so distance > 10
      const bufferAVariant = Buffer.alloc(64);
      for (let i = 0; i < 64; i++) bufferAVariant[i] = 64 - i; // hash: ffffffffffffffff

      vi.mocked(fsPromises.readFile)
        .mockResolvedValueOnce(bufferA)
        .mockResolvedValueOnce(bufferAVariant);
      
      const dedup = new Deduplicator(5);
      const files = [
        { path: 'a.png', filename: 'a.png' },
        { path: 'a_variant.png', filename: 'a_variant.png' }
      ] as any[];

      const { unique, duplicates } = await dedup.deduplicate(files);

      expect(unique).toHaveLength(2);
      expect(duplicates).toHaveLength(0);
    });
  });
});
