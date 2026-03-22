/**
 * BananaGenAgent — Top-level orchestrator for Phase 3.
 * Wires: BrandFingerprinter → AssetFoundry → MicrocopyGenerator → AssetOptimizer
 */

import type { ParsedFile, LayoutManifest, BrandTokens, GeneratedAsset, Microcopy } from '@vibespec/schemas';
import { BananaClient } from './banana-client.js';
import { BrandFingerprinter } from './brand-fingerprinter.js';
import { AssetFoundry } from './asset-foundry.js';
import { MicrocopyGenerator } from './microcopy-generator.js';
import { AssetOptimizer } from './asset-optimizer.js';

export interface BananaGenResult {
  brandTokens: BrandTokens;
  assets: GeneratedAsset[];
  microcopy: Microcopy[];
}

export class BananaGenAgent {
  private client: BananaClient;
  private fingerprinter: BrandFingerprinter;
  private foundry: AssetFoundry;
  private microcopyGen: MicrocopyGenerator;
  private optimizer: AssetOptimizer;

  constructor(apiKey?: string) {
    this.client = new BananaClient({ apiKey });
    this.fingerprinter = new BrandFingerprinter();
    this.foundry = new AssetFoundry(this.client);
    this.microcopyGen = new MicrocopyGenerator(this.client);
    this.optimizer = new AssetOptimizer();
  }

  /**
   * Run the full asset synthesis pipeline.
   */
  async generate(
    files: ParsedFile[],
    manifests: LayoutManifest[],
    outputDir: string
  ): Promise<BananaGenResult> {
    // Step 1: Brand fingerprinting
    const brandTokens = await this.fingerprinter.extract(files);

    // Step 2: Generate assets
    const screenIds = manifests.map((m) => m.screenId);
    const rawAssets = await this.foundry.generateAll(screenIds, brandTokens, outputDir);

    // Step 3: Optimize assets
    const assets = await this.optimizer.optimizeAll(rawAssets, outputDir);

    // Step 4: Generate microcopy
    const microcopy = await this.microcopyGen.generateAll(manifests);

    return { brandTokens, assets, microcopy };
  }
}
