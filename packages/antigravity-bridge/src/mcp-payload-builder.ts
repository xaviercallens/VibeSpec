/**
 * MCPPayloadBuilder — Assembles the Model Context Protocol (MCP) payload
 * from all pipeline artifacts for handoff to Google Antigravity.
 */

import type {
  MCPPayload,
  StatechartDefinition,
  EARSConstraint,
  BrandTokens,
  GeneratedAsset,
  Microcopy,
  TLAInvariant,
} from '@vibespec/schemas';

export class MCPPayloadBuilder {
  private payload: Partial<MCPPayload> = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    targetFramework: 'nextjs',
  };

  /** Set product briefs (markdown keyed by screen ID). */
  setProductBriefs(briefs: Record<string, string>): this {
    this.payload.productBriefs = briefs;
    return this;
  }

  /** Set XState machine definitions. */
  setStatecharts(statecharts: StatechartDefinition[]): this {
    this.payload.statecharts = statecharts;
    return this;
  }

  /** Set EARS constraints. */
  setConstraints(constraints: EARSConstraint[]): this {
    this.payload.constraints = constraints;
    return this;
  }

  /** Set brand tokens. */
  setBrandTokens(tokens: BrandTokens): this {
    this.payload.brandTokens = tokens;
    return this;
  }

  /** Set generated asset manifest. */
  setAssets(assets: GeneratedAsset[]): this {
    this.payload.assets = assets;
    return this;
  }

  /** Set microcopy per screen. */
  setMicrocopy(microcopy: Microcopy[]): this {
    this.payload.microcopy = microcopy;
    return this;
  }

  /** Set TLA+ invariants. */
  setInvariants(invariants: TLAInvariant[]): this {
    this.payload.invariants = invariants;
    return this;
  }

  /** Set target framework. */
  setFramework(framework: 'nextjs' | 'react' | 'svelte'): this {
    this.payload.targetFramework = framework;
    return this;
  }

  /** Build and validate the final MCP payload. */
  build(): MCPPayload {
    const p = this.payload;

    if (!p.productBriefs || Object.keys(p.productBriefs).length === 0) {
      throw new Error('MCPPayload requires at least one product brief.');
    }
    if (!p.statecharts || p.statecharts.length === 0) {
      throw new Error('MCPPayload requires at least one statechart.');
    }
    if (!p.constraints) p.constraints = [];
    if (!p.brandTokens) throw new Error('MCPPayload requires brand tokens.');
    if (!p.assets) p.assets = [];
    if (!p.microcopy) p.microcopy = [];
    if (!p.invariants) p.invariants = [];

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      productBriefs: p.productBriefs,
      statecharts: p.statecharts,
      constraints: p.constraints,
      brandTokens: p.brandTokens,
      assets: p.assets,
      microcopy: p.microcopy,
      invariants: p.invariants,
      targetFramework: p.targetFramework ?? 'nextjs',
    };
  }
}
