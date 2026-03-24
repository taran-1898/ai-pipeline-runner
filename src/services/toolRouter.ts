import { ModelRouter } from "./modelRouter";
import {
  ElevenLabsTool,
  GammaTool,
  PerplexityTool,
  RunwayTool,
} from "../agents/ExternalTools";
import { logger } from "../utils/logger";

export type ToolRouteKind = "tool" | "llm";

export type ArtifactType = "text" | "file" | "image" | "audio" | "video";

export interface ToolRouteResult {
  response: string;
  kind: ToolRouteKind;
  /**
   * Name of the concrete tool or LLM provider that produced the response.
   * For tools this is typically the tool's `name`, for LLMs the provider
   * constructor name.
   */
  name: string;
  /**
   * Best-effort artifact type associated with this result.
   */
  artifactType: ArtifactType;
  /**
   * High-level intent (image, voice, search, slides) if detected.
   */
  intent: Intent;
}

type Intent = "image" | "voice" | "search" | "slides" | null;

interface ToolRouterDeps {
  modelRouter?: ModelRouter;
  runway?: RunwayTool;
  elevenLabs?: ElevenLabsTool;
  perplexity?: PerplexityTool;
  gamma?: GammaTool;
}

export class ToolRouter {
  private readonly modelRouter: ModelRouter;
  private readonly runway: RunwayTool;
  private readonly elevenLabs: ElevenLabsTool;
  private readonly perplexity: PerplexityTool;
  private readonly gamma: GammaTool;

  constructor(deps?: ToolRouterDeps) {
    this.modelRouter = deps?.modelRouter ?? new ModelRouter();
    this.runway = deps?.runway ?? new RunwayTool();
    this.elevenLabs = deps?.elevenLabs ?? new ElevenLabsTool();
    this.perplexity = deps?.perplexity ?? new PerplexityTool();
    this.gamma = deps?.gamma ?? new GammaTool();
  }

  /**
   * Analyze the prompt and decide whether to call an external tool
   * (Runway, ElevenLabs, Perplexity, Gamma, …) or fall back to a
   * generic LLM call via ModelRouter.
   */
  async route(prompt: string): Promise<ToolRouteResult> {
    const intent = this.detectIntent(prompt);

    if (intent) {
      const { tool, name, artifactType } = this.getToolForIntent(intent);

      logger.info("ToolRouter routed prompt to external tool", {
        intent,
        tool: name,
        promptSnippet: prompt.slice(0, 200),
      });

      const response = await tool.invoke(prompt);

      logger.info("ToolRouter external tool invocation completed", {
        intent,
        tool: name,
        responseSnippet: response.slice(0, 200),
      });

      return {
        response,
        kind: "tool",
        name,
        artifactType,
        intent,
      };
    }

    const provider = this.modelRouter.getProviderForTask("cheap");

    logger.info("ToolRouter routed prompt to LLM", {
      provider: provider.constructor.name,
      promptSnippet: prompt.slice(0, 200),
    });

    const response = await provider.generate(prompt);

    logger.info("ToolRouter LLM invocation completed", {
      provider: provider.constructor.name,
      responseSnippet: response.slice(0, 200),
    });

    return {
      response,
      kind: "llm",
      name: provider.constructor.name,
      artifactType: "text",
      intent: null,
    };
  }

  private detectIntent(prompt: string): Intent {
    const lower = prompt.toLowerCase();

    if (
      /\b(image|picture|photo|graphic|illustration|thumbnail|cover|poster|video)\b/.test(
        lower
      )
    ) {
      return "image";
    }

    if (/\b(voice|audio|speech|narration|tts|text[-\s]?to[-\s]?speech)\b/.test(lower)) {
      return "voice";
    }

    if (/\b(search|web search|internet|look up|lookup|research)\b/.test(lower)) {
      return "search";
    }

    if (/\b(slides|slide deck|deck|presentation|pitch deck)\b/.test(lower)) {
      return "slides";
    }

    return null;
  }

  private getToolForIntent(
    intent: Intent
  ): {
    tool: { invoke(input: string): Promise<string> };
    name: string;
    artifactType: ArtifactType;
  } {
    switch (intent) {
      case "image":
        return { tool: this.runway, name: this.runway.name, artifactType: "image" };
      case "voice":
        return { tool: this.elevenLabs, name: this.elevenLabs.name, artifactType: "audio" };
      case "search":
        return { tool: this.perplexity, name: this.perplexity.name, artifactType: "text" };
      case "slides":
        return { tool: this.gamma, name: this.gamma.name, artifactType: "file" };
      default: {
        // This should never be hit because callers guard on intent !== null,
        // but keep a defensive fallback to LLM via ModelRouter.
        const provider = this.modelRouter.getProviderForTask("cheap");
        return {
          tool: {
            invoke: (input: string) => provider.generate(input),
          },
          name: provider.constructor.name,
          artifactType: "text",
        };
      }
    }
  }
}

