/**
 * BananaClient — Gemini "Banana" API client wrapper with retry and rate limiting.
 */

export interface BananaConfig {
  apiKey?: string;
  endpoint?: string;
  maxRetries?: number;
  rateLimitPerMinute?: number;
}

export interface GenerationRequest {
  prompt: string;
  referenceImages?: string[];
  outputFormat: 'svg' | 'webp' | 'png' | 'text';
  brandContext?: Record<string, unknown>;
}

export interface GenerationResponse {
  content: Buffer | string;
  format: string;
  metadata: Record<string, unknown>;
}

export class BananaClient {
  private config: Required<BananaConfig>;
  private requestCount = 0;
  private windowStart = Date.now();

  constructor(config: BananaConfig = {}) {
    this.config = {
      apiKey: config.apiKey ?? process.env.GEMINI_BANANA_API_KEY ?? '',
      endpoint: config.endpoint ?? 'https://generativelanguage.googleapis.com/v1beta',
      maxRetries: config.maxRetries ?? 3,
      rateLimitPerMinute: config.rateLimitPerMinute ?? 60,
    };
  }

  /**
   * Generate content using Gemini Banana.
   * In production, this calls the actual API. For now, returns mock data.
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    await this.checkRateLimit();

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await this.executeRequest(request);
      } catch (error) {
        if (attempt === this.config.maxRetries - 1) throw error;
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async executeRequest(request: GenerationRequest): Promise<GenerationResponse> {
    this.requestCount++;

    // Mock implementation — production replaces with actual Gemini Banana API call
    if (request.outputFormat === 'text') {
      return {
        content: `Generated text for: ${request.prompt}`,
        format: 'text',
        metadata: { model: 'gemini-banana', timestamp: new Date().toISOString() },
      };
    }

    if (request.outputFormat === 'svg') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
      return {
        content: Buffer.from(svg),
        format: 'svg',
        metadata: { model: 'gemini-banana', timestamp: new Date().toISOString() },
      };
    }

    // Default: return a 1x1 pixel placeholder
    const pixel = Buffer.from('UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoBAAEAAkA4JZQCdAEO/hepgAAA/v3dH//+3f/+6v///Xv+un/7dm/+h/1//s1/rP+Z/0v/F/6D/lv///7b/2f+5+wD/r/+r/+sAAAA=', 'base64');
    return {
      content: pixel,
      format: request.outputFormat,
      metadata: { model: 'gemini-banana', timestamp: new Date().toISOString() },
    };
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.windowStart > 60000) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    if (this.requestCount >= this.config.rateLimitPerMinute) {
      const waitTime = 60000 - (now - this.windowStart);
      await this.delay(waitTime);
      this.requestCount = 0;
      this.windowStart = Date.now();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
