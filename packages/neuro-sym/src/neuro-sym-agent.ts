/**
 * NeuroSymAgent — Top-level orchestrator for Neuro-Symbolic Specification.
 *
 * Wires together: ProductBriefGenerator → FlowExtractor → XStateSynthesizer
 *                 → EARSGenerator → TLAGenerator
 */

import type { LayoutManifest, UserFlow, StatechartDefinition, EARSConstraint, TLAInvariant } from '@vibespec/schemas';
import { ProductBriefGenerator } from './product-brief-generator.js';
import { FlowExtractor } from './flow-extractor.js';
import { XStateSynthesizer } from './xstate-synthesizer.js';
import { EARSGenerator } from './ears-generator.js';
import { TLAGenerator } from './tla-generator.js';

/** Full result from the neuro-symbolic phase. */
export interface NeuroSymResult {
  /** Product briefs keyed by screen ID (markdown strings) */
  productBriefs: Record<string, string>;
  /** Extracted user flow graph */
  userFlow: UserFlow;
  /** XState machine definitions */
  statecharts: StatechartDefinition[];
  /** EARS constraints */
  constraints: EARSConstraint[];
  /** EARS constraints as text */
  constraintsText: string;
  /** TLA+ invariants */
  invariants: TLAInvariant[];
  /** Full TLA+ specification */
  tlaSpec: string;
}

export class NeuroSymAgent {
  private briefGen: ProductBriefGenerator;
  private flowExtractor: FlowExtractor;
  private xstateSynth: XStateSynthesizer;
  private earsGen: EARSGenerator;
  private tlaGen: TLAGenerator;

  constructor() {
    this.briefGen = new ProductBriefGenerator();
    this.flowExtractor = new FlowExtractor();
    this.xstateSynth = new XStateSynthesizer();
    this.earsGen = new EARSGenerator();
    this.tlaGen = new TLAGenerator();
  }

  /**
   * Run the full neuro-symbolic pipeline.
   *
   * @param manifests - Layout manifests from Phase 1 ingestion.
   * @returns NeuroSymResult with all generated specifications.
   */
  process(manifests: LayoutManifest[]): NeuroSymResult {
    // Step 1: Generate product briefs
    const productBriefs = this.briefGen.generateAll(manifests);

    // Step 2: Extract user flows
    const userFlow = this.flowExtractor.extract(manifests);

    // Step 3: Synthesize XState machines
    const statecharts = [this.xstateSynth.synthesize(userFlow)];

    // Step 4: Generate EARS constraints
    const constraints = this.earsGen.generate(userFlow);
    const constraintsText = this.earsGen.toEARSText(constraints);

    // Step 5: Generate TLA+ invariants and spec
    const invariants = this.tlaGen.generateInvariants(constraints, userFlow);
    const tlaSpec = this.tlaGen.generateSpec(invariants, userFlow);

    return {
      productBriefs,
      userFlow,
      statecharts,
      constraints,
      constraintsText,
      invariants,
      tlaSpec,
    };
  }
}
