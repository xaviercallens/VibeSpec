/**
 * @vibespec/rl-validator — RL Validation & Formal Proofs (Phase 5)
 *
 * OPEN-SOURCE STACK:
 * - Playwright (browser automation)
 * - Z3 Theorem Prover (spatial constraint verification)
 * - Scallop (neuro-symbolic bridge)
 * - Apalache (TLA+ model checking via SMT)
 * - axe-core (accessibility testing)
 * - BrowserGym/WebArena (RL environment)
 * - Stable-Baselines3/Ray RLlib (PPO training)
 *
 * NSVE (Neuro-Symbolic Validation Engine):
 * - Two-brain architecture (neural perception + symbolic reasoning)
 * - Explainable counterexample traces for self-healing
 */

export { RLAgent } from './rl-agent.js';
export { SymbolicMonitor } from './symbolic-monitor.js';
export { SelfHealingLoop } from './self-healing-loop.js';
export { ProofGenerator } from './proof-generator.js';
export { A11yAgent } from './a11y-agent.js';
export { ValidatorAgent } from './validator-agent.js';
export { Z3SpatialProver } from './z3-spatial-prover.js';
export { ScallopBridge } from './scallop-bridge.js';
export { NSVEEngine } from './nsve-engine.js';
export type { ObservedSymbolicGraph, IntendedSymbolicGraph, NSVEResult, NeuralFact, CounterexampleTrace } from './nsve-engine.js';
