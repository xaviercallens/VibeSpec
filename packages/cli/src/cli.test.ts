import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCLI } from '../src/cli.js';
import * as cliUtils from '../src/cli.js';
import { VibeSpecPipeline } from '../src/pipeline.js';

describe('VibeSpec CLI', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let runSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });
    runSpy = vi.spyOn(VibeSpecPipeline.prototype, 'run').mockResolvedValue({
      deploymentUrl: 'https://mock.localhost',
      proofCertificate: {} as any,
      outputDir: './mock'
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    runSpy.mockRestore();
  });

  it('prints help if no arguments provided', async () => {
    await expect(runCLI([])).rejects.toThrow('Process exited with code 0');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Input path (zip'));
  });

  it('runs the full pipeline with "run" command', async () => {
    await runCLI(['run', '--input', 'mockups.zip']);
    expect(runSpy).toHaveBeenCalledTimes(1);
  });

  it('handles "ingest" subcommand', async () => {
    await runCLI(['ingest', '--input', 'mockups.zip']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Ingestion completed'));
  });

  it('handles "generate" subcommand', async () => {
    await runCLI(['generate']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Generate command —'));
  });

  it('handles "deploy" subcommand', async () => {
    await runCLI(['deploy']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deploy command —'));
  });

  it('handles "verify" subcommand', async () => {
    await runCLI(['verify']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Verify command —'));
  });

  it('handles "account" subcommand', async () => {
    await runCLI(['account']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('VibeSpec Account'));
  });

  it('handles "schedule" subcommand', async () => {
    await runCLI(['schedule']);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully scheduled'));
  });

  it('handles invalid commands', async () => {
    await expect(async () => {
      await runCLI(['fake-command']);
    }).rejects.toThrow('Process exited with code 1');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
  });
});
