---
name: Z3 Spatial Prover
description: The mathematical engine powered by the Microsoft Z3 solver. Takes CSSOM bounds and mathematically proves spatial relationships.
---

# Z3 Spatial Prover
Agent instructions:
1. Provide the CSSOM JSON file representing the rendered page bounds.
2. The prover will execute SMT queries to verify layout stability from 320px to 4000px.
3. If this solver returns UNSAT or violates an assertion, auto-heal the generated code and re-run.
