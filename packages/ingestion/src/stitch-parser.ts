/**
 * StitchParser — Native Google Stitch project ingestion.
 *
 * Bypasses VLM image-parsing entirely by consuming Stitch's structured outputs:
 * - Code Scaffold (HTML5, React components, Tailwind CSS)
 * - Prototype Manifest (flow.json — screen transitions)
 * - Design System (DESIGN.md — ground-truth design tokens)
 *
 * Supports two ingestion vectors:
 * A) Offline pipeline: .zip extraction
 * B) Live MCP synchronization: URL binding (via StitchMCPClient)
 */

import { readFile, readdir, mkdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { execSync } from 'node:child_process';
import type { LayoutManifest, UIElement } from '@vibespec/schemas';

/** Stitch project payload after extraction. */
export interface StitchProject {
  /** Parsed DESIGN.md tokens */
  designTokens: StitchDesignTokens;
  /** Screen transition flow from flow.json */
  flow: StitchFlow;
  /** Extracted React/HTML component code */
  components: StitchComponent[];
  /** Raw DESIGN.md content */
  designMarkdown: string;
  /** Layout manifests derived from structured code (no VLM needed) */
  manifests: LayoutManifest[];
}

/** Design tokens from Stitch's DESIGN.md */
export interface StitchDesignTokens {
  colors: Record<string, string>;       // e.g., { "primary": "#3b82f6", "bg-dark": "#0f172a" }
  typography: {
    fontFamily: string[];
    fontSizes: Record<string, string>;   // e.g., { "xs": "0.75rem", "sm": "0.875rem" }
    fontWeights: Record<string, number>;
    lineHeights: Record<string, string>;
  };
  spacing: Record<string, string>;       // e.g., { "sm": "8px", "md": "16px", "lg": "24px" }
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  zIndex: Record<string, number>;
  breakpoints: Record<string, number>;   // e.g., { "sm": 640, "md": 768, "lg": 1024 }
}

/** Screen transition from Stitch prototype */
export interface StitchTransition {
  from: string;
  to: string;
  trigger: string;             // e.g., "onClick_btn_login"
  triggerElement: string;       // CSS selector or element ID
  animation?: string;
}

/** Stitch flow.json content */
export interface StitchFlow {
  version: string;
  screens: string[];
  transitions: StitchTransition[];
  entryScreen: string;
}

/** Extracted component from Stitch code scaffold */
export interface StitchComponent {
  name: string;
  screenId: string;
  filePath: string;
  code: string;
  /** Placeholders that need Banana asset replacement */
  placeholders: StitchPlaceholder[];
}

/** Stitch placeholder for Banana asset injection */
export interface StitchPlaceholder {
  tag: string;               // e.g., <img class="stitch-placeholder" />
  dataIntent: string;        // e.g., "user_avatar_3d"
  surroundingContext: string; // DOM context for Banana prompt
  cssSelector: string;
}

export class StitchParser {
  /**
   * Parse a Stitch .zip export or directory.
   */
  async parse(inputPath: string): Promise<StitchProject> {
    let projectDir = inputPath;

    // If zip, extract first
    if (inputPath.endsWith('.zip')) {
      projectDir = inputPath.replace('.zip', '-stitch');
      await mkdir(projectDir, { recursive: true });
      execSync(`unzip -o "${inputPath}" -d "${projectDir}"`, { stdio: 'ignore' });
    }

    // Parse the three streams
    const designMarkdown = await this.findAndRead(projectDir, 'DESIGN.md');
    const designTokens = this.parseDesignMD(designMarkdown);
    const flow = await this.parseFlow(projectDir);
    const components = await this.parseComponents(projectDir);
    const manifests = this.componentsToManifests(components, designTokens);

    return { designTokens, flow, components, designMarkdown, manifests };
  }

  /**
   * Parse DESIGN.md into structured design tokens.
   * Stitch generates this with exact hex codes, typography, spacing, z-index, etc.
   */
  parseDesignMD(markdown: string): StitchDesignTokens {
    const tokens: StitchDesignTokens = {
      colors: {},
      typography: { fontFamily: [], fontSizes: {}, fontWeights: {}, lineHeights: {} },
      spacing: {},
      borderRadius: {},
      shadows: {},
      zIndex: {},
      breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
    };

    // Parse color definitions: `--color-primary: #3b82f6`
    const colorRegex = /--(?:color[-_])?(\w[\w-]*)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
    let match;
    while ((match = colorRegex.exec(markdown)) !== null) {
      tokens.colors[match[1]] = match[2];
    }

    // Parse spacing: `--spacing-md: 16px`
    const spacingRegex = /--spacing[-_](\w+)\s*:\s*(\d+(?:\.\d+)?(?:px|rem))/g;
    while ((match = spacingRegex.exec(markdown)) !== null) {
      tokens.spacing[match[1]] = match[2];
    }

    // Parse font families
    const fontFamilyRegex = /font[-_]family\s*:\s*["']?([^"'\n;]+)/gi;
    while ((match = fontFamilyRegex.exec(markdown)) !== null) {
      tokens.typography.fontFamily.push(match[1].trim());
    }

    // Parse font sizes: `--font-size-lg: 1.25rem`
    const fontSizeRegex = /--font[-_]size[-_](\w+)\s*:\s*(\d+(?:\.\d+)?(?:px|rem))/g;
    while ((match = fontSizeRegex.exec(markdown)) !== null) {
      tokens.typography.fontSizes[match[1]] = match[2];
    }

    // Parse border radius: `--radius-md: 0.5rem`
    const radiusRegex = /--(?:border[-_])?radius[-_](\w+)\s*:\s*(\d+(?:\.\d+)?(?:px|rem))/g;
    while ((match = radiusRegex.exec(markdown)) !== null) {
      tokens.borderRadius[match[1]] = match[2];
    }

    // Parse z-index values
    const zIndexRegex = /--z[-_](?:index[-_])?(\w+)\s*:\s*(\d+)/g;
    while ((match = zIndexRegex.exec(markdown)) !== null) {
      tokens.zIndex[match[1]] = parseInt(match[2]);
    }

    // Parse breakpoints
    const bpRegex = /--breakpoint[-_](\w+)\s*:\s*(\d+)px/g;
    while ((match = bpRegex.exec(markdown)) !== null) {
      tokens.breakpoints[match[1]] = parseInt(match[2]);
    }

    // Set defaults if nothing was extracted
    if (tokens.typography.fontFamily.length === 0) {
      tokens.typography.fontFamily = ['Inter', 'system-ui', 'sans-serif'];
    }
    if (Object.keys(tokens.colors).length === 0) {
      tokens.colors = { primary: '#3b82f6', secondary: '#8b5cf6', background: '#0f172a', text: '#f8fafc' };
    }

    return tokens;
  }

  /**
   * Parse flow.json — Stitch's prototype transition matrix.
   */
  private async parseFlow(projectDir: string): Promise<StitchFlow> {
    try {
      const flowContent = await this.findAndRead(projectDir, 'flow.json');
      return JSON.parse(flowContent);
    } catch {
      // Generate flow from component structure if flow.json doesn't exist
      return {
        version: '1.0.0',
        screens: [],
        transitions: [],
        entryScreen: 'home',
      };
    }
  }

  /**
   * Parse component code from Stitch's code scaffold.
   */
  private async parseComponents(projectDir: string): Promise<StitchComponent[]> {
    const components: StitchComponent[] = [];
    const extensions = ['.tsx', '.jsx', '.html'];

    const scanDir = async (dir: string) => {
      let entries: string[] = [];
      try { entries = await readdir(dir); } catch { return; }

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const ext = extname(entry);

        if (extensions.includes(ext)) {
          const code = await readFile(fullPath, 'utf-8');
          const name = basename(entry, ext);
          const screenId = name.replace(/Page$|Screen$|Component$/i, '').toLowerCase();
          const placeholders = this.extractPlaceholders(code);

          components.push({ name, screenId, filePath: fullPath, code, placeholders });
        }

        // Recurse into directories
        try {
          const stat = await import('node:fs/promises').then((m) => m.stat(fullPath));
          if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
            await scanDir(fullPath);
          }
        } catch { /* skip */ }
      }
    };

    await scanDir(projectDir);
    return components;
  }

  /**
   * Extract Stitch placeholder tags for Banana asset injection.
   * Looks for: <img class="stitch-placeholder" data-intent="user_avatar_3d" />
   */
  private extractPlaceholders(code: string): StitchPlaceholder[] {
    const placeholders: StitchPlaceholder[] = [];
    const regex = /<img[^>]*class="[^"]*stitch-placeholder[^"]*"[^>]*data-intent="([^"]*)"[^>]*\/?>/g;
    let match;

    while ((match = regex.exec(code)) !== null) {
      // Capture surrounding context (±200 chars)
      const start = Math.max(0, match.index - 200);
      const end = Math.min(code.length, match.index + match[0].length + 200);

      placeholders.push({
        tag: match[0],
        dataIntent: match[1],
        surroundingContext: code.slice(start, end),
        cssSelector: `img[data-intent="${match[1]}"]`,
      });
    }

    return placeholders;
  }

  /**
   * Convert Stitch components into LayoutManifests (deterministic, no VLM needed).
   */
  private componentsToManifests(
    components: StitchComponent[],
    tokens: StitchDesignTokens
  ): LayoutManifest[] {
    return components.map((comp) => {
      const elements = this.parseHTMLToElements(comp.code);
      const breakpoints = Object.values(tokens.breakpoints).sort((a, b) => a - b);

      return {
        version: '1.0.0',
        screenId: comp.screenId,
        viewport: { width: 1440, height: 900 },
        layoutStrategy: this.detectLayoutStrategy(comp.code) as 'grid' | 'flex' | 'absolute',
        elements,
        breakpoints,
      };
    });
  }

  /** Parse HTML/JSX into UIElement tree. */
  private parseHTMLToElements(code: string): UIElement[] {
    const elements: UIElement[] = [];
    const tagRegex = /<(header|nav|main|footer|section|article|aside|button|input|a|h[1-6]|p|div|img|form)\b[^>]*>/gi;
    let match;
    let yPos = 0;

    while ((match = tagRegex.exec(code)) !== null) {
      const tag = match[1].toLowerCase();
      const fullTag = match[0];

      // Extract label from content or aria-label
      const ariaMatch = fullTag.match(/aria-label="([^"]*)"/);
      const classMatch = fullTag.match(/class(?:Name)?="([^"]*)"/);

      const element: UIElement = {
        type: this.tagToType(tag),
        bbox: { x: 0, y: yPos, width: 100, height: 8 },
        semanticTag: tag,
        layoutHint: classMatch ? this.tailwindToLayoutHint(classMatch[1]) : undefined,
        label: ariaMatch ? ariaMatch[1] : undefined,
      };

      elements.push(element);
      yPos += 8;
    }

    return elements;
  }

  private tagToType(tag: string): string {
    const map: Record<string, string> = {
      button: 'button', input: 'input', a: 'button', img: 'image',
      h1: 'text', h2: 'text', h3: 'text', p: 'text',
      nav: 'container', header: 'container', footer: 'container',
      main: 'container', section: 'container', form: 'container',
      article: 'container', aside: 'container', div: 'container',
    };
    return map[tag] ?? 'container';
  }

  private tailwindToLayoutHint(classes: string): string {
    if (classes.includes('grid')) return 'grid';
    if (classes.includes('flex-col')) return 'flex-col';
    if (classes.includes('flex')) return 'flex-row';
    return 'block';
  }

  private detectLayoutStrategy(code: string): string {
    if (code.includes('grid') || code.includes('Grid')) return 'grid';
    if (code.includes('flex') || code.includes('Flex')) return 'flex';
    return 'grid';
  }

  private async findAndRead(dir: string, filename: string): Promise<string> {
    // Try direct path first
    try {
      return await readFile(join(dir, filename), 'utf-8');
    } catch { /* continue */ }

    // Recursive search
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name === filename) {
        return readFile(join(dir, entry.name), 'utf-8');
      }
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        try {
          return await this.findAndRead(join(dir, entry.name), filename);
        } catch { /* continue */ }
      }
    }
    throw new Error(`${filename} not found in ${dir}`);
  }
}
