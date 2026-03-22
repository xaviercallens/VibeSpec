import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  VLMMapper, 
  Qwen25VLBackend, 
  UITARSBackend, 
  DefaultVLMBackend 
} from '../src/vlm-mapper.js';
import * as fsPromises from 'node:fs/promises';

vi.mock('node:fs/promises');

describe('VLMMapper', () => {
  let globalFetch: any;

  beforeEach(() => {
    vi.resetAllMocks();
    globalFetch = vi.spyOn(global, 'fetch').mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"version": "1.0.0", "elements": []}' } }]
      })
    }) as any);
    
    vi.mocked(fsPromises.readFile).mockResolvedValue(Buffer.from('fake-image'));
  });

  afterEach(() => {
    globalFetch.mockRestore();
    delete process.env.QWEN_VL_ENDPOINT;
    delete process.env.UITARS_ENDPOINT;
  });

  describe('Qwen25VLBackend', () => {
    it('analyzes screen and parses JSON correctly', async () => {
      const backend = new Qwen25VLBackend();
      const manifest = await backend.analyzeScreen('scr1', 'test.png', ['text1']);
      
      expect(globalFetch).toHaveBeenCalled();
      expect(manifest.version).toBe('1.0.0');
    });

    it('falls back to DefaultVLMBackend on API failure', async () => {
      globalFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' });
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const backend = new Qwen25VLBackend();
      const manifest = await backend.analyzeScreen('scr1', 'test.png', ['text1']);
      
      expect(consoleWarn).toHaveBeenCalled();
      expect(manifest.screenId).toBe('scr1');
      expect(manifest.elements).toHaveLength(3); // DefaultVLMBackend returns 3 root elements
      
      consoleWarn.mockRestore();
    });

    it('falls back if JSON parsing fails', async () => {
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '' } }] }) // Empty content
      });
      const backend = new Qwen25VLBackend();
      const manifest = await backend.analyzeScreen('scr1', 'test.png', []);
      expect(manifest.elements).toHaveLength(3);
    });
  });

  describe('UITARSBackend', () => {
    it('delegates to Qwen25VLBackend under the hood', async () => {
      const backend = new UITARSBackend();
      const manifest = await backend.analyzeScreen('scr2', 'test.png', []);
      expect(globalFetch).toHaveBeenCalled();
      expect(manifest.version).toBe('1.0.0');
    });
  });

  describe('DefaultVLMBackend', () => {
    it('returns a standard heuristic layout immediately without network calls', async () => {
      const backend = new DefaultVLMBackend();
      const manifest = await backend.analyzeScreen('scr3', 'test.png', ['ButtonA']);
      
      expect(globalFetch).not.toHaveBeenCalled();
      expect(manifest.screenId).toBe('scr3');
      expect(manifest.elements[0].children?.[1].children?.[0].label).toBe('ButtonA');
    });
  });

  describe('VLMMapper Orchestration', () => {
    it('auto-selects Default backend if no env vars set', () => {
      const mapper = new VLMMapper();
      expect((mapper as any).backend).toBeInstanceOf(DefaultVLMBackend);
    });

    it('auto-selects Qwen backend if env var set', () => {
      process.env.QWEN_VL_ENDPOINT = 'http://localhost';
      const mapper = new VLMMapper();
      expect((mapper as any).backend).toBeInstanceOf(Qwen25VLBackend);
    });

    it('auto-selects UITARS backend if env var set', () => {
      process.env.UITARS_ENDPOINT = 'http://localhost';
      const mapper = new VLMMapper();
      expect((mapper as any).backend).toBeInstanceOf(UITARSBackend);
    });

    it('maps all screens', async () => {
      const mapper = new VLMMapper(new DefaultVLMBackend());
      const screens = [
        { id: 's1', root: { path: '1.png' }, extractedText: [] },
        { id: 's2', root: { path: '2.png' }, extractedText: [] }
      ] as any[];
      
      const manifests = await mapper.mapAll(screens);
      expect(manifests).toHaveLength(2);
      expect(manifests[0].screenId).toBe('s1');
      expect(manifests[1].screenId).toBe('s2');
    });
  });
});
