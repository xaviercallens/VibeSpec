/**
 * BridgeAgent — Top-level orchestrator for Phase 4.
 * Assembles MCP payload and deploys to Antigravity.
 */

import type { MCPPayload, DeploymentResult } from '@vibespec/schemas';
import { MCPPayloadBuilder } from './mcp-payload-builder.js';
import { AntigravityClient } from './antigravity-client.js';

export interface BridgeResult {
  payload: MCPPayload;
  deployment: DeploymentResult;
}

export class BridgeAgent {
  private client: AntigravityClient;

  constructor(token?: string) {
    this.client = new AntigravityClient({ token });
  }

  /**
   * Assemble and deploy.
   */
  async deploy(
    neuroSymResult: {
      productBriefs: Record<string, string>;
      statecharts: import('@vibespec/schemas').StatechartDefinition[];
      constraints: import('@vibespec/schemas').EARSConstraint[];
      invariants: import('@vibespec/schemas').TLAInvariant[];
    },
    bananaGenResult: {
      brandTokens: import('@vibespec/schemas').BrandTokens;
      assets: import('@vibespec/schemas').GeneratedAsset[];
      microcopy: import('@vibespec/schemas').Microcopy[];
    },
    framework: 'nextjs' | 'react' | 'svelte' = 'nextjs'
  ): Promise<BridgeResult> {
    const payload = new MCPPayloadBuilder()
      .setProductBriefs(neuroSymResult.productBriefs)
      .setStatecharts(neuroSymResult.statecharts)
      .setConstraints(neuroSymResult.constraints)
      .setBrandTokens(bananaGenResult.brandTokens)
      .setAssets(bananaGenResult.assets)
      .setMicrocopy(bananaGenResult.microcopy)
      .setInvariants(neuroSymResult.invariants)
      .setFramework(framework)
      .build();

    const deployment = await this.client.deploy(payload);

    return { payload, deployment };
  }
}
