import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngestAgent } from '../src/ingest-agent.js';
import { FileParser } from '../src/file-parser.js';
import { Deduplicator } from '../src/deduplicator.js';
import { OCRExtractor } from '../src/ocr-extractor.js';
import { VariationGrouper } from '../src/variation-grouper.js';
import { VLMMapper } from '../src/vlm-mapper.js';

vi.mock('../src/file-parser.js');
vi.mock('../src/deduplicator.js');
vi.mock('../src/ocr-extractor.js');
vi.mock('../src/variation-grouper.js');
vi.mock('../src/vlm-mapper.js');

describe('IngestAgent', () => {
  let agent: IngestAgent;

  beforeEach(() => {
    vi.resetAllMocks();
    agent = new IngestAgent();
  });

  it('throws an error if no files are found', async () => {
    vi.mocked(FileParser.prototype.parse).mockResolvedValue([]);
    vi.mocked(FileParser.prototype.getSkippedFiles).mockReturnValue([]);

    await expect(agent.ingest('empty.zip')).rejects.toThrow('No valid mockup files found');
  });

  it('runs the full ingestion pipeline successfully', async () => {
    const mockFiles = [{ filename: 'test.png', buffer: Buffer.from('') }];
    vi.mocked(FileParser.prototype.parse).mockResolvedValue(mockFiles as any);
    vi.mocked(FileParser.prototype.getSkippedFiles).mockReturnValue(['skipped.txt']);

    vi.mocked(Deduplicator.prototype.deduplicate).mockResolvedValue({
      unique: mockFiles as any,
      duplicates: ['dup.png'],
    });

    const mockGroups = [
      {
        id: 'g1',
        root: mockFiles[0],
        variants: [],
        extractedText: []
      }
    ];
    vi.mocked(VariationGrouper.prototype.group).mockReturnValue(mockGroups as any);

    vi.mocked(OCRExtractor.prototype.extractBatch).mockResolvedValue([
      { id: 'g1', textBlocks: ['Hello', 'World'], confidence: 0.9 }
    ] as any);

    vi.mocked(VLMMapper.prototype.mapAll).mockResolvedValue([
      { id: 'm1', semantics: {} }
    ] as any);

    const result = await agent.ingest('mockups.zip');
    
    expect(result.screens).toHaveLength(1);
    expect(result.screens[0].extractedText).toEqual(['Hello', 'World']);
    expect(result.manifests).toHaveLength(1);
    expect(result.stats).toEqual({
      totalFilesFound: 2, // 1 valid + 1 skipped
      duplicatesRemoved: 1,
      unsupportedSkipped: 1,
      screenGroupsCreated: 1
    });
  });
});
