/**
 * @vibespec/ingestion — Multimodal Ingestion Engine (Phase 1)
 *
 * Supports two ingestion vectors:
 * - Traditional: mockup images → VLM → layout manifests
 * - Stitch Native: .zip / MCP → deterministic parsing (no VLM needed)
 */

export { FileParser } from './file-parser.js';
export { Deduplicator } from './deduplicator.js';
export { OCRExtractor } from './ocr-extractor.js';
export { VariationGrouper } from './variation-grouper.js';
export { VLMMapper, Qwen25VLBackend, UITARSBackend, DefaultVLMBackend } from './vlm-mapper.js';
export { IngestAgent } from './ingest-agent.js';

// Google Stitch integration
export { StitchParser } from './stitch-parser.js';
export type { StitchProject, StitchDesignTokens, StitchFlow, StitchTransition, StitchComponent, StitchPlaceholder } from './stitch-parser.js';
export { DesignTokenEngine } from './design-token-engine.js';
export type { DesignConstraint } from './design-token-engine.js';
export { StitchMCPClient } from './stitch-mcp-client.js';
export type { StitchMCPEvent } from './stitch-mcp-client.js';
