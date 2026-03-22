import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileParser } from '../src/file-parser.js';
import * as fsPromises from 'node:fs/promises';
import * as childProcess from 'node:child_process';
import * as util from 'node:util';
import * as os from 'node:os';

vi.mock('node:fs/promises');
vi.mock('node:child_process');
vi.mock('node:util');
vi.mock('node:os');

describe('FileParser', () => {
  let parser: FileParser;

  beforeEach(() => {
    vi.resetAllMocks();
    parser = new FileParser();
    
    // Default mocks
    vi.mocked(os.tmpdir).mockReturnValue('/tmp');
    vi.mocked(fsPromises.mkdtemp).mockResolvedValue('/tmp/vibespec-123');
    vi.mocked(fsPromises.rm).mockResolvedValue(undefined);
  });

  it('parses a single supported image file', async () => {
    vi.mocked(fsPromises.stat).mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true,
      size: 1024
    } as any);

    const files = await parser.parse('test.png');
    
    expect(files).toHaveLength(1);
    expect(files[0]).toEqual({
      filename: 'test.png',
      path: 'test.png',
      mimeType: 'image/png',
      sizeBytes: 1024
    });
    expect(parser.getSkippedFiles()).toHaveLength(0);
  });

  it('skips unsupported files', async () => {
    vi.mocked(fsPromises.stat).mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true,
      size: 1024
    } as any);

    const files = await parser.parse('document.pdf');
    
    expect(files).toHaveLength(0);
    expect(parser.getSkippedFiles()).toEqual(['document.pdf']);
  });

  it('parses a directory recursively', async () => {
    // Mock directory stat
    vi.mocked(fsPromises.stat).mockImplementation(async (path: any) => {
      if (path === 'mock-dir') return { isDirectory: () => true, isFile: () => false, size: 4096 } as any;
      return { isDirectory: () => false, isFile: () => true, size: 2048 } as any; // For files
    });

    vi.mocked(fsPromises.readdir).mockImplementation(async (path: any) => {
      if (path === 'mock-dir') {
        return [
          { name: 'image.jpg', isDirectory: () => false, isFile: () => true },
          { name: 'notes.txt', isDirectory: () => false, isFile: () => true }
        ] as any;
      }
      return [];
    });

    const files = await parser.parse('mock-dir');
    
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe('image.jpg');
    expect(files[0].mimeType).toBe('image/jpeg');
    expect(parser.getSkippedFiles()).toHaveLength(1); // notes.txt is skipped
  });

  it('parses a zip file by extracting it', async () => {
    // Top-level isFile for zip
    vi.mocked(fsPromises.stat).mockImplementation(async (path: any) => {
      if (path === 'archive.zip') return { isDirectory: () => false, isFile: () => true, size: 5000 } as any;
      return { isDirectory: () => false, isFile: () => true, size: 1000 } as any; 
    });

    const mockExecFileAsync = vi.fn().mockResolvedValue({ stdout: '', stderr: '' });
    vi.mocked(util.promisify).mockReturnValue(mockExecFileAsync as any);

    // Mock directory read for the extracted temp dir
    vi.mocked(fsPromises.readdir).mockResolvedValue([
      { name: 'extracted.webp', isDirectory: () => false, isFile: () => true }
    ] as any);

    const files = await parser.parse('archive.zip');
    
    expect(mockExecFileAsync).toHaveBeenCalledWith('unzip', ['-o', '-q', 'archive.zip', '-d', '/tmp/vibespec-123']);
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe('extracted.webp');
  });

  it('handles zip extraction failures gracefully', async () => {
    vi.mocked(fsPromises.stat).mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true,
      size: 5000
    } as any);

    const mockExecFileAsync = vi.fn().mockRejectedValue(new Error('Zip error'));
    vi.mocked(util.promisify).mockReturnValue(mockExecFileAsync as any);

    const files = await parser.parse('bad.zip');
    
    expect(files).toHaveLength(0);
  });
});
