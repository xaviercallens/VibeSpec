/**
 * VibeSpecPipeline — Full end-to-end orchestrator.
 *
 * Two ingestion modes:
 * 1. Traditional: mockup images → VLM (Qwen2.5-VL) → layout manifests
 * 2. Stitch Native: .zip / MCP URL → deterministic parsing (no VLM needed)
 *
 * Chains: Phase 1 (Ingest) → Phase 2 (NeuroSym) → Phase 3 (BananaGen)
 *         → Phase 4 (Antigravity) → Phase 5 (Validate)
 */

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { FormalProofCertificate } from '@vibespec/schemas';
import { IngestAgent, StitchParser, DesignTokenEngine } from '@vibespec/ingestion';
import { NeuroSymAgent } from '@vibespec/neuro-sym';
import { BananaGenAgent } from '@vibespec/banana-gen';
import { BridgeAgent } from '@vibespec/antigravity-bridge';
import { ValidatorAgent } from '@vibespec/rl-validator';

export interface PipelineResult {
  deploymentUrl: string;
  proofCertificate: FormalProofCertificate;
  outputDir: string;
}

export class VibeSpecPipeline {
  /**
   * Run the full VibeSpec pipeline end-to-end.
   * Auto-detects Stitch projects vs. traditional mockup directories.
   */
  async run(
    inputPath: string,
    outputDir: string,
    framework: 'nextjs' | 'react' | 'svelte' = 'nextjs'
  ): Promise<PipelineResult> {
    console.log('🚀 VibeSpec Pipeline Starting...');
    const startTime = Date.now();

    await mkdir(outputDir, { recursive: true });
    const assetsDir = join(outputDir, 'public', 'assets');
    await mkdir(assetsDir, { recursive: true });

    // Auto-detect: Stitch project or traditional mockup?
    const isStitch = await this.isStitchProject(inputPath);

    if (isStitch) {
      return this.runStitchPipeline(inputPath, outputDir, assetsDir, framework, startTime);
    }
    return this.runTraditionalPipeline(inputPath, outputDir, assetsDir, framework, startTime);
  }

  /**
   * Stitch-native pipeline: deterministic, no VLM needed.
   * DESIGN.md → tailwind.config.ts + Z3 constraints
   */
  private async runStitchPipeline(
    inputPath: string,
    outputDir: string,
    assetsDir: string,
    framework: 'nextjs' | 'react' | 'svelte',
    startTime: number
  ): Promise<PipelineResult> {
    // ── Phase 1: Stitch Ingestion ───────────────────────────
    console.log('\n🎨 Phase 1: Google Stitch Native Ingestion...');
    const stitch = new StitchParser();
    const stitchProject = await stitch.parse(inputPath);
    console.log(`   ✅ ${stitchProject.components.length} components, ${stitchProject.flow.transitions.length} transitions`);

    // Generate exact design constraints (no VLM estimation!)
    const tokenEngine = new DesignTokenEngine();
    const tailwindConfig = tokenEngine.generateTailwindConfig(stitchProject.designTokens);
    const designConstraints = tokenEngine.generateConstraints(stitchProject.designTokens);
    const smtSpec = tokenEngine.toSMTLIB(stitchProject.designTokens);

    await writeFile(join(outputDir, 'tailwind.config.ts'), tailwindConfig);
    await writeFile(join(outputDir, 'design-tokens.smt2'), smtSpec);
    await writeFile(join(outputDir, 'DESIGN.md'), stitchProject.designMarkdown);

    // ── Phase 2: Neuro-Symbolic ─────────────────────────────
    console.log('\n🧠 Phase 2: Neuro-Symbolic Specification...');
    const neuroSym = new NeuroSymAgent();
    const neuroSymResult = neuroSym.process(stitchProject.manifests);
    console.log(`   ✅ ${Object.keys(neuroSymResult.productBriefs).length} briefs, ${neuroSymResult.constraints.length} constraints`);

    await writeFile(join(outputDir, 'constraints.ears'), neuroSymResult.constraintsText);
    await writeFile(join(outputDir, 'invariants.tla'), neuroSymResult.tlaSpec);
    for (const [screenId, brief] of Object.entries(neuroSymResult.productBriefs)) {
      await writeFile(join(outputDir, `PRODUCT-BRIEF-${screenId}.md`), brief);
    }

    // ── Phase 3: Banana Gen (replace Stitch placeholders) ───
    console.log('\n🍌 Phase 3: Gemini Banana Asset Synthesis...');
    const bananaGen = new BananaGenAgent();
    const rootFiles = stitchProject.components.map((c) => ({
      path: c.filePath,
      name: c.name,
      filename: c.name + '.tsx',
      mimeType: 'text/typescript' as const,
      format: 'tsx' as const,
      sizeBytes: c.code.length,
    }));
    const bananaResult = await bananaGen.generate(rootFiles, stitchProject.manifests, assetsDir);
    console.log(`   ✅ ${bananaResult.assets.length} assets, ${stitchProject.components.reduce((s, c) => s + c.placeholders.length, 0)} placeholders replaced`);

    await writeFile(join(outputDir, 'brand-tokens.json'), JSON.stringify(bananaResult.brandTokens, null, 2));

    // ── Phase 4: Antigravity Deployment ─────────────────────
    console.log('\n🚀 Phase 4: Antigravity Deployment...');
    const bridge = new BridgeAgent();
    const bridgeResult = await bridge.deploy(neuroSymResult, bananaResult, framework);
    console.log(`   ✅ Deployed: ${bridgeResult.deployment.url}`);

    await writeFile(join(outputDir, 'mcp-payload.json'), JSON.stringify(bridgeResult.payload, null, 2));

    // ── Phase 5: NSVE Validation ────────────────────────────
    console.log('\n🔍 Phase 5: Neuro-Symbolic Validation...');
    const validator = new ValidatorAgent(neuroSymResult.constraints);
    const validationResult = await validator.validate(
      bridgeResult.deployment.url,
      neuroSymResult.invariants,
      bananaResult.assets.length * 5
    );
    console.log(`   ✅ Coverage: ${(validationResult.coverage * 100).toFixed(1)}%`);
    console.log(`   📜 Proof: ${validationResult.proofCertificate.conclusion}`);

    await writeFile(join(outputDir, 'formal_proof.tla'), validationResult.proofTLA);
    await writeFile(join(outputDir, 'proof-certificate.json'), JSON.stringify(validationResult.proofCertificate, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✨ Stitch pipeline complete in ${elapsed}s`);
    console.log(`   📁 Output: ${outputDir}`);
    console.log(`   🌐 Preview: ${bridgeResult.deployment.url}`);

    return {
      deploymentUrl: bridgeResult.deployment.url,
      proofCertificate: validationResult.proofCertificate,
      outputDir,
    };
  }

  /**
   * Traditional pipeline: mockup images → VLM → layout manifests.
   */
  private async runTraditionalPipeline(
    inputPath: string,
    outputDir: string,
    assetsDir: string,
    framework: 'nextjs' | 'react' | 'svelte',
    startTime: number
  ): Promise<PipelineResult> {
    // ── Phase 1: Ingestion ─────────────────────────────────
    console.log('\n📥 Phase 1: Multimodal Ingestion...');
    const ingestResult = await this.ingest(inputPath);
    console.log(`   ✅ ${ingestResult.stats.screenGroupsCreated} screens ingested, ${ingestResult.stats.duplicatesRemoved} duplicates removed`);

    // ── Phase 2: Neuro-Symbolic ─────────────────────────────
    console.log('\n🧠 Phase 2: Neuro-Symbolic Specification...');
    const neuroSym = new NeuroSymAgent();
    const neuroSymResult = neuroSym.process(ingestResult.manifests);
    console.log(`   ✅ ${Object.keys(neuroSymResult.productBriefs).length} product briefs, ${neuroSymResult.constraints.length} constraints, ${neuroSymResult.invariants.length} invariants`);

    await writeFile(join(outputDir, 'constraints.ears'), neuroSymResult.constraintsText);
    await writeFile(join(outputDir, 'invariants.tla'), neuroSymResult.tlaSpec);
    await writeFile(join(outputDir, 'user-flow.json'), JSON.stringify(neuroSymResult.userFlow, null, 2));
    for (const [screenId, brief] of Object.entries(neuroSymResult.productBriefs)) {
      await writeFile(join(outputDir, `PRODUCT-BRIEF-${screenId}.md`), brief);
    }
    for (const sc of neuroSymResult.statecharts) {
      await writeFile(join(outputDir, `statechart-${sc.id}.json`), JSON.stringify(sc, null, 2));
    }

    // ── Phase 3: Banana Gen ─────────────────────────────────
    console.log('\n🍌 Phase 3: Gemini Banana Asset Synthesis...');
    const bananaGen = new BananaGenAgent();
    const rootFiles = ingestResult.screens.map((s) => s.root);
    const bananaResult = await bananaGen.generate(rootFiles, ingestResult.manifests, assetsDir);
    console.log(`   ✅ ${bananaResult.assets.length} assets generated, brand tokens extracted`);

    await writeFile(join(outputDir, 'brand-tokens.json'), JSON.stringify(bananaResult.brandTokens, null, 2));
    for (const mc of bananaResult.microcopy) {
      await writeFile(join(outputDir, `microcopy-${mc.screenId}.json`), JSON.stringify(mc, null, 2));
    }

    // ── Phase 4: Antigravity Bridge ─────────────────────────
    console.log('\n🚀 Phase 4: Antigravity Deployment...');
    const bridge = new BridgeAgent();
    const bridgeResult = await bridge.deploy(neuroSymResult, bananaResult, framework);
    console.log(`   ✅ Deployed: ${bridgeResult.deployment.url}`);

    await writeFile(join(outputDir, 'mcp-payload.json'), JSON.stringify(bridgeResult.payload, null, 2));

    // ── Phase 5: Validation ─────────────────────────────────
    console.log('\n🔍 Phase 5: RL Validation & Formal Proofs...');
    const validator = new ValidatorAgent(neuroSymResult.constraints);
    const validationResult = await validator.validate(
      bridgeResult.deployment.url,
      neuroSymResult.invariants,
      bananaResult.assets.length * 5
    );
    console.log(`   ✅ Coverage: ${(validationResult.coverage * 100).toFixed(1)}%, Violations: ${validationResult.violationsFound}`);
    console.log(`   📜 Proof: ${validationResult.proofCertificate.conclusion}`);

    await writeFile(join(outputDir, 'formal_proof.tla'), validationResult.proofTLA);
    await writeFile(join(outputDir, 'a11y-report.json'), JSON.stringify(validationResult.a11yReport, null, 2));
    await writeFile(join(outputDir, 'proof-certificate.json'), JSON.stringify(validationResult.proofCertificate, null, 2));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✨ Pipeline complete in ${elapsed}s`);
    console.log(`   📁 Output: ${outputDir}`);
    console.log(`   🌐 Preview: ${bridgeResult.deployment.url}`);

    return {
      deploymentUrl: bridgeResult.deployment.url,
      proofCertificate: validationResult.proofCertificate,
      outputDir,
    };
  }

  /** Detect if input is a Google Stitch project (has DESIGN.md or flow.json). */
  private async isStitchProject(inputPath: string): Promise<boolean> {
    try {
      const designPath = join(inputPath, 'DESIGN.md');
      await stat(designPath);
      return true;
    } catch { /* not found */ }
    try {
      const flowPath = join(inputPath, 'flow.json');
      await stat(flowPath);
      return true;
    } catch { /* not found */ }
    // Check for .tsx files (Stitch code scaffold)
    try {
      const { readdir } = await import('node:fs/promises');
      const entries = await readdir(inputPath);
      return entries.some((e) => e.endsWith('.tsx') || e.endsWith('.jsx'));
    } catch { /* not accessible */ }
    return false;
  }

  /** Run Phase 1 only (traditional). */
  async ingest(inputPath: string) {
    const agent = new IngestAgent();
    return agent.ingest(inputPath);
  }

  /** Run Stitch import only. */
  async importStitch(inputPath: string) {
    const stitch = new StitchParser();
    return stitch.parse(inputPath);
  }
}
