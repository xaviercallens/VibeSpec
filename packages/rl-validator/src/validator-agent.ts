/**
 * ValidatorAgent — Top-level orchestrator for Phase 5.
 * Wires: RLAgent → SymbolicMonitor → SelfHealingLoop → ProofGenerator → A11yAgent
 */

import type { EARSConstraint, TLAInvariant, FormalProofCertificate, A11yReport } from '@vibespec/schemas';
import { RLAgent } from './rl-agent.js';
import { SymbolicMonitor } from './symbolic-monitor.js';
import { SelfHealingLoop } from './self-healing-loop.js';
import { ProofGenerator } from './proof-generator.js';
import { A11yAgent } from './a11y-agent.js';

export interface ValidationResult {
  coverage: number;
  episodes: number;
  violationsFound: number;
  healingResults: number;
  proofCertificate: FormalProofCertificate;
  proofTLA: string;
  a11yReport: A11yReport;
}

export class ValidatorAgent {
  private rlAgent: RLAgent;
  private monitor: SymbolicMonitor;
  private healer: SelfHealingLoop;
  private proofGen: ProofGenerator;
  private a11yAgent: A11yAgent;

  constructor(constraints: EARSConstraint[]) {
    this.rlAgent = new RLAgent();
    this.monitor = new SymbolicMonitor(constraints);
    this.healer = new SelfHealingLoop();
    this.proofGen = new ProofGenerator();
    this.a11yAgent = new A11yAgent();
  }

  /**
   * Run the full validation pipeline.
   */
  async validate(
    targetUrl: string,
    invariants: TLAInvariant[],
    totalElements: number
  ): Promise<ValidationResult> {
    // Step 1: RL Exploration
    const episodes = await this.rlAgent.explore(targetUrl, totalElements);

    // Step 2: Check for violations (simulated state checks)
    const violations = this.monitor.getAllViolations();

    // Step 3: Self-heal any violations
    const healingResults = await this.healer.healAll(violations);

    // Step 4: Accessibility audit
    const a11yReport = await this.a11yAgent.audit(targetUrl, totalElements);

    // Step 5: Generate proof certificate
    const coverage = this.rlAgent.getCoverage();
    const proofCertificate = this.proofGen.generate({
      invariants,
      statesExplored: this.rlAgent.getStatesVisited(),
      coverage,
      episodes: episodes.length,
      violationsFound: violations.length,
      selfHealCycles: healingResults.filter((r) => r.recompileTriggered).length,
      elementsTested: a11yReport.totalElements,
      a11yViolations: a11yReport.violations.length,
    });

    const proofTLA = this.proofGen.toTLAProof(proofCertificate);

    return {
      coverage,
      episodes: episodes.length,
      violationsFound: violations.length,
      healingResults: healingResults.length,
      proofCertificate,
      proofTLA,
      a11yReport,
    };
  }
}
