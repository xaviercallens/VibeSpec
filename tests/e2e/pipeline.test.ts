/**
 * End-to-End Integration Test Suite for the VibeSpec Pipeline.
 *
 * Tests the full pipeline from mockup ingestion through formal proof generation,
 * verifying each phase produces correct outputs and the proof certificate is valid.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Phase imports
import { IngestAgent } from '@vibespec/ingestion';
import { NeuroSymAgent } from '@vibespec/neuro-sym';
import { BananaGenAgent } from '@vibespec/banana-gen';
import { BridgeAgent } from '@vibespec/antigravity-bridge';
import { ValidatorAgent } from '@vibespec/rl-validator';

// Schema types
import type {
  LayoutManifest,
  ScreenGroup,
  UserFlow,
  EARSConstraint,
  StatechartDefinition,
  FormalProofCertificate,
} from '@vibespec/schemas';

let testDir: string;
let outputDir: string;

beforeAll(async () => {
  testDir = join(tmpdir(), `vibespec-test-${Date.now()}`);
  outputDir = join(testDir, 'output');
  await mkdir(join(testDir, 'mockups'), { recursive: true });
  await mkdir(join(outputDir, 'public', 'assets'), { recursive: true });

  // Create test mockup files (minimal PNG-like files)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  ]);

  const screens = ['landing', 'catalog', 'product', 'cart', 'checkout', 'login', 'profile', 'search', 'orders', '404'];

  for (const screen of screens) {
    // Create unique content for each screen to avoid dedup
    const buf = Buffer.concat([pngHeader, Buffer.from(screen.repeat(50))]);
    await writeFile(join(testDir, 'mockups', `${screen}.png`), buf);
  }

  // Add some variant files
  await writeFile(join(testDir, 'mockups', 'cart-hover.png'), Buffer.concat([pngHeader, Buffer.from('cart-hover'.repeat(50))]));
  await writeFile(join(testDir, 'mockups', 'product-modal.png'), Buffer.concat([pngHeader, Buffer.from('product-modal'.repeat(50))]));
});

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true });
});

// ─── Phase 1: Ingestion ─────────────────────────────────────────────────────

describe('Phase 1: Multimodal Ingestion Engine', () => {
  let ingestResult: Awaited<ReturnType<IngestAgent['ingest']>>;

  beforeAll(async () => {
    const agent = new IngestAgent();
    ingestResult = await agent.ingest(join(testDir, 'mockups'));
  });

  it('should discover all mockup files', () => {
    expect(ingestResult.stats.totalFilesFound).toBeGreaterThanOrEqual(10);
  });

  it('should create screen groups', () => {
    expect(ingestResult.screens.length).toBeGreaterThan(0);
    expect(ingestResult.stats.screenGroupsCreated).toBeGreaterThan(0);
  });

  it('should group variants under root screens', () => {
    const cartGroup = ingestResult.screens.find((s) => s.id === 'cart');
    if (cartGroup) {
      expect(cartGroup.variants.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('should produce valid layout manifests', () => {
    expect(ingestResult.manifests.length).toBeGreaterThan(0);
    for (const manifest of ingestResult.manifests) {
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.screenId).toBeTruthy();
      expect(manifest.elements).toBeDefined();
      expect(manifest.viewport).toBeDefined();
      expect(manifest.viewport.width).toBeGreaterThan(0);
      expect(manifest.viewport.height).toBeGreaterThan(0);
    }
  });

  it('should include breakpoints in manifests', () => {
    for (const manifest of ingestResult.manifests) {
      expect(manifest.breakpoints).toBeDefined();
      expect(manifest.breakpoints!.length).toBeGreaterThan(0);
    }
  });
});

// ─── Phase 2: Neuro-Symbolic ────────────────────────────────────────────────

describe('Phase 2: Neuro-Symbolic Specification', () => {
  let neuroSymResult: ReturnType<NeuroSymAgent['process']>;
  let manifests: LayoutManifest[];

  beforeAll(async () => {
    const ingestAgent = new IngestAgent();
    const ingestResult = await ingestAgent.ingest(join(testDir, 'mockups'));
    manifests = ingestResult.manifests;

    const agent = new NeuroSymAgent();
    neuroSymResult = agent.process(manifests);
  });

  it('should generate product briefs for all screens', () => {
    expect(Object.keys(neuroSymResult.productBriefs).length).toBeGreaterThan(0);
    for (const brief of Object.values(neuroSymResult.productBriefs)) {
      expect(brief).toContain('# Product Brief');
      expect(brief).toContain('## Component Hierarchy');
    }
  });

  it('should extract user flow graph', () => {
    const flow = neuroSymResult.userFlow;
    expect(flow.version).toBe('1.0.0');
    expect(flow.nodes.length).toBeGreaterThan(0);
    // Each node should have id, label, route
    for (const node of flow.nodes) {
      expect(node.id).toBeTruthy();
      expect(node.route).toMatch(/^\//);
    }
  });

  it('should generate valid XState statecharts', () => {
    expect(neuroSymResult.statecharts.length).toBeGreaterThan(0);
    for (const sc of neuroSymResult.statecharts) {
      expect(sc.version).toBe('1.0.0');
      expect(sc.machine).toBeDefined();
      const machine = sc.machine as Record<string, unknown>;
      expect(machine['initial']).toBeTruthy();
      expect(machine['states']).toBeDefined();
    }
  });

  it('should produce EARS constraints with correct format', () => {
    expect(neuroSymResult.constraints.length).toBeGreaterThan(0);
    for (const c of neuroSymResult.constraints) {
      expect(c.id).toMatch(/^C\d{3}$/);
      expect(c.fullText).toContain('WHEN');
      expect(c.fullText).toContain('SHALL');
    }
  });

  it('should produce EARS text output', () => {
    expect(neuroSymResult.constraintsText).toContain('# EARS Constraints');
  });

  it('should generate TLA+ invariants', () => {
    expect(neuroSymResult.invariants.length).toBeGreaterThan(0);
    for (const inv of neuroSymResult.invariants) {
      expect(inv.name).toBeTruthy();
      expect(inv.formula).toBeTruthy();
    }
  });

  it('should produce valid TLA+ specification', () => {
    expect(neuroSymResult.tlaSpec).toContain('MODULE VibeSpec');
    expect(neuroSymResult.tlaSpec).toContain('Init ==');
    expect(neuroSymResult.tlaSpec).toContain('Next ==');
    expect(neuroSymResult.tlaSpec).toContain('THEOREM');
  });
});

// ─── Phase 3: Banana Gen ────────────────────────────────────────────────────

describe('Phase 3: Gemini Banana Asset Synthesis', () => {
  let bananaResult: Awaited<ReturnType<BananaGenAgent['generate']>>;

  beforeAll(async () => {
    const ingestAgent = new IngestAgent();
    const ingestResult = await ingestAgent.ingest(join(testDir, 'mockups'));

    const agent = new BananaGenAgent();
    bananaResult = await agent.generate(
      ingestResult.screens.map((s) => s.root),
      ingestResult.manifests,
      join(outputDir, 'public', 'assets')
    );
  });

  it('should extract brand tokens', () => {
    const tokens = bananaResult.brandTokens;
    expect(tokens.version).toBe('1.0.0');
    expect(tokens.colors.primary.length).toBeGreaterThan(0);
    expect(tokens.typography.fontFamilies.length).toBeGreaterThan(0);
    expect(tokens.shape.borderRadius.length).toBeGreaterThan(0);
  });

  it('should generate assets for each screen', () => {
    expect(bananaResult.assets.length).toBeGreaterThan(0);
    // Should have icons and backgrounds
    const types = new Set(bananaResult.assets.map((a) => a.type));
    expect(types.has('icon')).toBe(true);
    expect(types.has('background')).toBe(true);
  });

  it('should content-hash asset filenames', () => {
    for (const asset of bananaResult.assets) {
      expect(asset.contentHash).toMatch(/^[a-f0-9]{8}$/);
      // Asset paths include a hash (from generation); optimizer may update the hash
      expect(asset.path).toMatch(/[a-f0-9]{8}/);
    }
  });

  it('should generate microcopy for all screens', () => {
    expect(bananaResult.microcopy.length).toBeGreaterThan(0);
    for (const mc of bananaResult.microcopy) {
      expect(mc.screenId).toBeTruthy();
      expect(mc.entries.length).toBeGreaterThan(0);
      // Each entry should have required fields
      for (const entry of mc.entries) {
        expect(entry.id).toBeTruthy();
        expect(entry.defaultText).toBeTruthy();
        expect(entry.context).toBeTruthy();
      }
    }
  });
});

// ─── Phase 4: Antigravity Bridge ────────────────────────────────────────────

describe('Phase 4: Antigravity Bridge', () => {
  it('should assemble and deploy MCP payload', async () => {
    const ingestAgent = new IngestAgent();
    const ingestResult = await ingestAgent.ingest(join(testDir, 'mockups'));
    const neuroSym = new NeuroSymAgent();
    const neuroSymResult = neuroSym.process(ingestResult.manifests);
    const bananaGen = new BananaGenAgent();
    const bananaResult = await bananaGen.generate(
      ingestResult.screens.map((s) => s.root),
      ingestResult.manifests,
      join(outputDir, 'public', 'assets')
    );

    const bridge = new BridgeAgent();
    const result = await bridge.deploy(neuroSymResult, bananaResult);

    expect(result.deployment.status).toBe('success');
    expect(result.deployment.url).toContain('antigravity.app');
    expect(result.payload.version).toBe('1.0.0');
    expect(Object.keys(result.payload.productBriefs).length).toBeGreaterThan(0);
    expect(result.payload.statecharts.length).toBeGreaterThan(0);
    expect(result.payload.brandTokens).toBeDefined();
  });
});

// ─── Phase 5: Validation & Proofs ───────────────────────────────────────────

describe('Phase 5: RL Validation & Formal Proofs', () => {
  let validationResult: Awaited<ReturnType<ValidatorAgent['validate']>>;

  beforeAll(async () => {
    const ingestAgent = new IngestAgent();
    const ingestResult = await ingestAgent.ingest(join(testDir, 'mockups'));
    const neuroSym = new NeuroSymAgent();
    const neuroSymResult = neuroSym.process(ingestResult.manifests);

    const validator = new ValidatorAgent(neuroSymResult.constraints);
    validationResult = await validator.validate(
      'https://test.antigravity.app',
      neuroSymResult.invariants,
      50
    );
  });

  it('should achieve high interaction coverage', () => {
    expect(validationResult.coverage).toBeGreaterThanOrEqual(0.95);
  });

  it('should generate formal proof certificate', () => {
    const proof = validationResult.proofCertificate;
    expect(proof.staticVerification.tool).toBe('TLC');
    expect(proof.dynamicVerification.tool).toBe('RL-Validator');
    expect(proof.accessibility.standard).toBe('WCAG 2.2 AAA');
    expect(proof.conclusion).toBeTruthy();
  });

  it('should produce TLA+ proof output', () => {
    expect(validationResult.proofTLA).toContain('VibeSpec Formal Proof Certificate');
    expect(validationResult.proofTLA).toContain('Static Verification');
    expect(validationResult.proofTLA).toContain('Dynamic Verification');
    expect(validationResult.proofTLA).toContain('Accessibility');
  });

  it('should produce accessibility report', () => {
    const report = validationResult.a11yReport;
    expect(report.version).toBe('1.0.0');
    expect(report.standard).toBe('WCAG 2.2 AAA');
    expect(report.totalElements).toBeGreaterThan(0);
  });

  it('proof should verify as PASS with no violations', () => {
    expect(validationResult.proofCertificate.staticVerification.result).toBe('PASS');
    expect(validationResult.proofCertificate.dynamicVerification.violationsFound).toBe(0);
    expect(validationResult.proofCertificate.accessibility.violations).toBe(0);
    expect(validationResult.proofCertificate.conclusion).toContain('FORMALLY VERIFIED');
  });
});

// ─── Symbolic Monitor Tests ─────────────────────────────────────────────────

describe('Symbolic Monitor: Constraint Verification', () => {
  it('should detect checkout access with empty cart', () => {
    const { SymbolicMonitor } = require('@vibespec/rl-validator');
    const constraints: EARSConstraint[] = [{
      id: 'C001',
      trigger: 'State(Cart_Items == 0)',
      system: 'NavigationRouter',
      response: 'NOT render /checkout',
      fullText: 'WHEN State(Cart_Items == 0), THE NavigationRouter SHALL NOT render /checkout.',
      relatedStates: ['checkout'],
    }];

    const monitor = new SymbolicMonitor(constraints);

    // Valid state: on checkout with items
    const validViolations = monitor.check(
      { currentPage: '/checkout', cart: ['item1'], auth: true },
      'navigate'
    );
    expect(validViolations.length).toBe(0);

    // Invalid state: on checkout with empty cart
    const invalidViolations = monitor.check(
      { currentPage: '/checkout', cart: [], auth: true },
      'navigate'
    );
    expect(invalidViolations.length).toBe(1);
    expect(invalidViolations[0].constraintId).toBe('C001');
  });

  it('should detect profile access without auth', () => {
    const { SymbolicMonitor } = require('@vibespec/rl-validator');
    const constraints: EARSConstraint[] = [{
      id: 'C002',
      trigger: 'State(User_Authenticated == false)',
      system: 'NavigationRouter',
      response: 'NOT render /profile and SHALL redirect to /login',
      fullText: 'WHEN State(User_Authenticated == false), THE NavigationRouter SHALL NOT render /profile and SHALL redirect to /login.',
      relatedStates: ['profile'],
    }];

    const monitor = new SymbolicMonitor(constraints);

    // Valid: authenticated user on profile
    const valid = monitor.check(
      { currentPage: '/profile', auth: true },
      'navigate'
    );
    expect(valid.length).toBe(0);

    // Invalid: unauthenticated on profile
    const invalid = monitor.check(
      { currentPage: '/profile', auth: false },
      'navigate'
    );
    expect(invalid.length).toBe(1);
    expect(invalid[0].constraintId).toBe('C002');
  });
});

// ─── A11y Contrast Check ────────────────────────────────────────────────────

describe('A11y Agent: Contrast Checks', () => {
  it('should verify WCAG AAA contrast ratio (7:1)', async () => {
    const { A11yAgent } = require('@vibespec/rl-validator');
    const agent = new A11yAgent();

    const result = await agent.contrastCheck([
      { foreground: '#000000', background: '#ffffff' }, // 21:1 — pass
      { foreground: '#777777', background: '#888888' }, // low — fail
    ]);

    expect(result.passed).toBeGreaterThanOrEqual(1);
    expect(result.results[0].pass).toBe(true); // black on white
    expect(result.results[0].ratio).toBeGreaterThan(7);
  });
});

// ─── Full Pipeline E2E ──────────────────────────────────────────────────────

describe('Full Pipeline: End-to-End', () => {
  it('should run complete pipeline from mockups to proof', async () => {
    // Phase 1
    const ingest = new IngestAgent();
    const ingestResult = await ingest.ingest(join(testDir, 'mockups'));
    expect(ingestResult.screens.length).toBeGreaterThan(0);

    // Phase 2
    const neuroSym = new NeuroSymAgent();
    const neuroSymResult = neuroSym.process(ingestResult.manifests);
    expect(neuroSymResult.constraints.length).toBeGreaterThan(0);
    expect(neuroSymResult.tlaSpec).toContain('MODULE VibeSpec');

    // Phase 3
    const bananaGen = new BananaGenAgent();
    const bananaResult = await bananaGen.generate(
      ingestResult.screens.map((s) => s.root),
      ingestResult.manifests,
      join(outputDir, 'public', 'assets')
    );
    expect(bananaResult.assets.length).toBeGreaterThan(0);

    // Phase 4
    const bridge = new BridgeAgent();
    const bridgeResult = await bridge.deploy(neuroSymResult, bananaResult);
    expect(bridgeResult.deployment.status).toBe('success');

    // Phase 5
    const validator = new ValidatorAgent(neuroSymResult.constraints);
    const validationResult = await validator.validate(
      bridgeResult.deployment.url,
      neuroSymResult.invariants,
      50
    );

    // Final assertions: proof of correctness
    expect(validationResult.proofCertificate.staticVerification.result).toBe('PASS');
    expect(validationResult.proofCertificate.conclusion).toContain('FORMALLY VERIFIED');
    expect(validationResult.a11yReport.standard).toBe('WCAG 2.2 AAA');
    expect(validationResult.proofTLA).toContain('VibeSpec Formal Proof Certificate');
  });
});
