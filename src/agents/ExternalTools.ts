import { AITool } from "./AITool";
import { config } from "../config/env";

/**
 * The following tool wrappers are intentionally thin and mostly stubbed.
 * They provide a clear integration point and naming, and can be filled in
 * with real HTTP calls as needed.
 */

abstract class BaseTool implements AITool {
  abstract readonly name: string;
  abstract protected hasApiKey(): boolean;

  protected abstract callProvider(input: string): Promise<string>;

  async invoke(input: string): Promise<string> {
    if (!this.hasApiKey()) {
      return `[${this.name} stubbed output] ${input.slice(0, 200)}`;
    }
    return this.callProvider(input);
  }
}

export class GeminiTool extends BaseTool {
  readonly name = "gemini";
  protected hasApiKey(): boolean {
    return !!config.geminiApiKey;
  }

  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement Google Gemini API call.
    return `[Gemini real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class BananaTool extends BaseTool {
  readonly name = "banana";
  protected hasApiKey(): boolean {
    return !!config.bananaApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement Banana.dev API call.
    return `[Banana real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class FlowTool extends BaseTool {
  readonly name = "flow";
  protected hasApiKey(): boolean {
    return !!config.flowApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement Flow/Flowise/related orchestration API call.
    return `[Flow real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class RunwayTool extends BaseTool {
  readonly name = "runway";
  protected hasApiKey(): boolean {
    return !!config.runwayApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement Runway ML API call for video/image generation.
    return `[Runway real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class ElevenLabsTool extends BaseTool {
  readonly name = "elevenlabs";
  protected hasApiKey(): boolean {
    return !!config.elevenLabsApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement ElevenLabs API call for TTS/voice.
    return `[ElevenLabs real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class PerplexityTool extends BaseTool {
  readonly name = "perplexity";
  protected hasApiKey(): boolean {
    return !!config.perplexityApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement Perplexity AI search API call.
    return `[Perplexity real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class FathomTool extends BaseTool {
  readonly name = "fathom";
  protected hasApiKey(): boolean {
    return !!config.fathomApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement Fathom AI/analytics API call.
    return `[Fathom real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class GammaTool extends BaseTool {
  readonly name = "gamma";
  protected hasApiKey(): boolean {
    return !!config.gammaApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement Gamma (presentation/doc generation) API call.
    return `[Gamma real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class CursorTool extends BaseTool {
  readonly name = "cursor";
  protected hasApiKey(): boolean {
    return !!config.cursorApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // TODO: Implement Cursor API integration if/when available.
    return `[Cursor real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

