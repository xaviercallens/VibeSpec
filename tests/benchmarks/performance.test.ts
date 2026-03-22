/**
 * Performance benchmark — ensures pipeline completes within 15 minutes
 * for a 10-screen mockup directory (simulation mode, no GPU).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IngestAgent } from '@vibespec/ingestion';
import { NeuroSymAgent } from '@vibespec/neuro-sym';
import { BananaGenAgent } from '@vibespec/banana-gen';
import { BridgeAgent } from '@vibespec/antigravity-bridge';
import { ValidatorAgent } from '@vibespec/rl-validator';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Performance Benchmarks', () => {
  let inputDir: string;
  let outputDir: string;

  // Set up a mock 10-screen project
  beforeAll(async () => {
    inputDir = await mkdtemp(join(tmpdir(), 'vibespec-bench-input-'));
    outputDir = await mkdtemp(join(tmpdir(), 'vibespec-bench-output-'));

    // Create 10 "screen" images (1x1 pixel PNGs)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
      0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const screens = [
      'home', 'login', 'dashboard', 'profile', 'settings',
      'cart', 'checkout', 'products', 'product-detail', 'contact',
    ];

    for (const screen of screens) {
      await writeFile(join(inputDir, `${screen}.png`), pngHeader);
    }

    await mkdir(join(outputDir, 'public', 'assets'), { recursive: true });
  });

  afterAll(async () => {
    await rm(inputDir, { recursive: true, force: true });
    await rm(outputDir, { recursive: true, force: true });
  });

  it('Phase 1: ingestion completes in < 5s for 10 screens', async () => {
    const start = Date.now();
    const agent = new IngestAgent();
    const result = await agent.ingest(inputDir);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
    expect(result.screens.length).toBeGreaterThanOrEqual(1);
    console.log(`  Phase 1: ${elapsed}ms (${result.screens.length} screens)`);
  });

  it('Phase 2: neuro-sym completes in < 2s', async () => {
    const agent = new IngestAgent();
    const ingestResult = await agent.ingest(inputDir);

    const start = Date.now();
    const neuroSym = new NeuroSymAgent();
    const result = neuroSym.process(ingestResult.manifests);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(result.constraints.length).toBeGreaterThanOrEqual(0);
    console.log(`  Phase 2: ${elapsed}ms (${result.constraints.length} constraints)`);
  });

  it('Phase 3: banana-gen completes in < 3s', async () => {
    const agent = new IngestAgent();
    const ingestResult = await agent.ingest(inputDir);

    const start = Date.now();
    const bananaGen = new BananaGenAgent();
    const rootFiles = ingestResult.screens.map((s: any) => s.root);
    const result = await bananaGen.generate(rootFiles, ingestResult.manifests, join(outputDir, 'public', 'assets'));
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
    expect(result.assets.length).toBeGreaterThan(0);
    console.log(`  Phase 3: ${elapsed}ms (${result.assets.length} assets)`);
  });

  it('Phase 4: antigravity bridge completes in < 2s', async () => {
    const agent = new IngestAgent();
    const ingestResult = await agent.ingest(inputDir);
    const neuroSym = new NeuroSymAgent();
    const neuroSymResult = neuroSym.process(ingestResult.manifests);
    const bananaGen = new BananaGenAgent();
    const rootFiles = ingestResult.screens.map((s) => s.root);
    const bananaResult = await bananaGen.generate(rootFiles, ingestResult.manifests, join(outputDir, 'public', 'assets'));

    const start = Date.now();
    const bridge = new BridgeAgent();
    const result = await bridge.deploy(neuroSymResult, bananaResult, 'nextjs');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(result.deployment.url).toBeTruthy();
    console.log(`  Phase 4: ${elapsed}ms`);
  });

  it('Phase 5: RL validation completes in < 5s (simulation)', async () => {
    const agent = new IngestAgent();
    const ingestResult = await agent.ingest(inputDir);
    const neuroSym = new NeuroSymAgent();
    const neuroSymResult = neuroSym.process(ingestResult.manifests);

    const start = Date.now();
    const validator = new ValidatorAgent(neuroSymResult.constraints);
    const result = await validator.validate(
      'http://localhost:3000',
      neuroSymResult.invariants,
      50
    );
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
    expect(result.coverage).toBeGreaterThan(0.9);
    console.log(`  Phase 5: ${elapsed}ms (coverage: ${(result.coverage * 100).toFixed(1)}%)`);
  });

  it('full pipeline (simulation) completes in < 15s for 10 screens', async () => {
    const start = Date.now();

    // Phase 1
    const agent = new IngestAgent();
    const ingestResult = await agent.ingest(inputDir);

    // Phase 2
    const neuroSym = new NeuroSymAgent();
    const neuroSymResult = neuroSym.process(ingestResult.manifests);

    // Phase 3
    const bananaGen = new BananaGenAgent();
    const rootFiles = ingestResult.screens.map((s: any) => s.root);
    const bananaResult = await bananaGen.generate(
      rootFiles,
      ingestResult.manifests,
      join(outputDir, 'public', 'assets')
    );

    // Phase 4
    const bridge = new BridgeAgent();
    const bridgeResult = await bridge.deploy(neuroSymResult, bananaResult, 'nextjs');

    // Phase 5
    const validator = new ValidatorAgent(neuroSymResult.constraints);
    const validationResult = await validator.validate(
      bridgeResult.deployment.url,
      neuroSymResult.invariants,
      bananaResult.assets.length * 5
    );

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(15000);
    expect(validationResult.proofCertificate.conclusion).toContain('FORMALLY VERIFIED');
    console.log(`  Full Pipeline: ${elapsed}ms (< 15s target)`);
  });
});
