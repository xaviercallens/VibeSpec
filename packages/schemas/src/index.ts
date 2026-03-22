/**
 * @vibespec/schemas — Shared type definitions and JSON schemas for the VibeSpec pipeline.
 *
 * This package is the single source of truth for all inter-package data contracts.
 */

// ─── Phase 1: Ingestion Types ───────────────────────────────────────────────

/** A single parsed file from the ingestion daemon. */
export interface ParsedFile {
  /** Original filename */
  filename: string;
  /** Absolute path to the extracted file on disk */
  path: string;
  /** MIME type (image/png, image/jpeg, image/webp) */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Perceptual hash for deduplication */
  pHash?: string;
}

/** A group of visual variations belonging to the same root screen. */
export interface ScreenGroup {
  /** Unique screen identifier */
  id: string;
  /** The primary/root screen image */
  root: ParsedFile;
  /** Variants (hover, dropdown, modal overlays, etc.) */
  variants: ParsedFile[];
  /** OCR-extracted text from the screen */
  extractedText: string[];
}

/** A single UI element detected by the VLM. */
export interface UIElement {
  /** Element type: button, input, carousel, image, text, container, nav, etc. */
  type: string;
  /** Bounding box in the mockup (percentages for responsiveness). */
  bbox: { x: number; y: number; width: number; height: number };
  /** Detected label or text content */
  label?: string;
  /** Semantic HTML5 tag suggestion */
  semanticTag?: string;
  /** CSS layout hint (grid-area, flex-order, etc.) */
  layoutHint?: string;
  /** Nested children for containers */
  children?: UIElement[];
}

/** The layout manifest produced by VLM perception mapping. */
export interface LayoutManifest {
  /** Schema version */
  version: '1.0.0';
  /** Screen identifier matching the ScreenGroup.id */
  screenId: string;
  /** Root-level viewport dimensions of the mockup */
  viewport: { width: number; height: number };
  /** Top-level layout strategy (grid, flex, etc.) */
  layoutStrategy: 'grid' | 'flex' | 'absolute';
  /** Hierarchical tree of detected UI elements */
  elements: UIElement[];
  /** Detected responsive breakpoints */
  breakpoints?: number[];
}

// ─── Phase 2: Neuro-Symbolic Types ──────────────────────────────────────────

/** A node in the user flow directed graph. */
export interface FlowNode {
  /** Page/screen ID */
  id: string;
  /** Display label */
  label: string;
  /** Route path (e.g., "/checkout") */
  route: string;
}

/** An edge in the user flow directed graph. */
export interface FlowEdge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Triggering action label */
  action: string;
  /** Guard condition (EARS constraint ID) */
  guard?: string;
}

/** User flow directed graph. */
export interface UserFlow {
  version: '1.0.0';
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/** A single EARS constraint. */
export interface EARSConstraint {
  /** Constraint unique ID (e.g., "C001") */
  id: string;
  /** The trigger event */
  trigger: string;
  /** The system/component */
  system: string;
  /** The required response/behavior */
  response: string;
  /** Full text: "WHEN [trigger], THE [system] SHALL [response]" */
  fullText: string;
  /** Related state machine state IDs */
  relatedStates: string[];
}

/** XState-compatible state machine definition. */
export interface StatechartDefinition {
  id: string;
  version: '1.0.0';
  /** XState v5 machine config (JSON-serializable) */
  machine: Record<string, unknown>;
}

/** TLA+ invariant stub. */
export interface TLAInvariant {
  /** Invariant name (e.g., "Invariant_Checkout_Access") */
  name: string;
  /** Human-readable description */
  description: string;
  /** TLA+ formula */
  formula: string;
  /** Related EARS constraint IDs */
  constraintIds: string[];
}

// ─── Phase 3: Banana Gen Types ──────────────────────────────────────────────

/** Extracted brand design tokens. */
export interface BrandTokens {
  version: '1.0.0';
  /** Primary color palette (hex) */
  colors: {
    primary: string[];
    secondary: string[];
    neutral: string[];
    accent: string[];
  };
  /** Typography tokens */
  typography: {
    fontFamilies: string[];
    fontWeights: number[];
    fontSizes: string[];
  };
  /** Shape tokens */
  shape: {
    borderRadius: string[];
    shadows: string[];
  };
}

/** A generated asset record. */
export interface GeneratedAsset {
  /** Asset unique ID */
  id: string;
  /** Asset type */
  type: 'icon' | 'logo' | 'image' | 'avatar' | 'background';
  /** File path relative to /public/assets/ */
  path: string;
  /** File format */
  format: 'svg' | 'webp' | 'png';
  /** Content hash of the file */
  contentHash: string;
  /** Source screen ID this asset was generated for */
  screenId: string;
}

/** Generated microcopy for a screen. */
export interface Microcopy {
  screenId: string;
  entries: {
    /** Unique key for i18n */
    id: string;
    /** Default English text */
    defaultText: string;
    /** Contextual description for translators */
    context: string;
    /** SEO relevance: title, meta-description, heading, body */
    seoRole?: 'title' | 'meta-description' | 'heading' | 'body';
  }[];
}

// ─── Phase 4: Antigravity Bridge Types ──────────────────────────────────────

/** MCP payload envelope sent to Google Antigravity. */
export interface MCPPayload {
  version: '1.0.0';
  /** Timestamp of payload creation */
  timestamp: string;
  /** Product briefs (markdown strings, keyed by screen ID) */
  productBriefs: Record<string, string>;
  /** XState machine definitions */
  statecharts: StatechartDefinition[];
  /** EARS constraints */
  constraints: EARSConstraint[];
  /** Brand tokens */
  brandTokens: BrandTokens;
  /** Asset manifest */
  assets: GeneratedAsset[];
  /** Microcopy per screen */
  microcopy: Microcopy[];
  /** TLA+ invariants */
  invariants: TLAInvariant[];
  /** Target framework */
  targetFramework: 'nextjs' | 'react' | 'svelte';
}

/** Deployment result from Antigravity. */
export interface DeploymentResult {
  /** Live preview URL */
  url: string;
  /** Deployment ID */
  deploymentId: string;
  /** Status */
  status: 'success' | 'failed' | 'pending';
  /** Timestamp */
  timestamp: string;
  /** Errors if any */
  errors?: string[];
}

// ─── Phase 5: Validation Types ──────────────────────────────────────────────

/** A single constraint violation detected by the symbolic monitor. */
export interface ConstraintViolation {
  /** The violated constraint ID */
  constraintId: string;
  /** The constraint text */
  constraintText: string;
  /** Application state at violation time */
  stateSnapshot: Record<string, unknown>;
  /** Action that triggered the violation */
  triggerAction: string;
  /** DOM snapshot (serialized HTML fragment) */
  domTrace: string;
  /** Timestamp */
  timestamp: string;
}

/** RL agent episode summary. */
export interface RLEpisode {
  /** Episode number */
  episode: number;
  /** Total reward */
  totalReward: number;
  /** Actions taken */
  actionCount: number;
  /** Unique elements interacted */
  uniqueElements: number;
  /** Violations detected */
  violations: ConstraintViolation[];
}

/** Formal proof certificate. */
export interface FormalProofCertificate {
  staticVerification: {
    tool: 'TLC';
    specFile: string;
    result: 'PASS' | 'FAIL';
    statesExplored: number;
    invariantsVerified: number;
    temporalPropertiesVerified: number;
    timestamp: string;
  };
  dynamicVerification: {
    tool: 'RL-Validator';
    coverage: number;
    episodes: number;
    violationsFound: number;
    selfHealCycles: number;
    timestamp: string;
  };
  accessibility: {
    tool: 'A11y-Agent';
    standard: 'WCAG 2.2 AAA';
    violations: number;
    elementsTested: number;
    timestamp: string;
  };
  conclusion: string;
}

/** Accessibility report. */
export interface A11yReport {
  version: '1.0.0';
  standard: 'WCAG 2.2 AAA';
  timestamp: string;
  totalElements: number;
  violations: {
    rule: string;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
    element: string;
    description: string;
  }[];
  passed: number;
  failed: number;
}
