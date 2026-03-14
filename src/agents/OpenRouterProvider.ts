import { LLMProvider } from "./LLMProvider";
import { config } from "../config/env";
import { fetch } from "undici";

/**
 * OpenRouter provider using the Completions API.
 *
 * Uses an OpenAI-compatible schema; this keeps the integration simple while
 * still allowing you to swap models via configuration later.
 */
export class OpenRouterProvider implements LLMProvider {
  async generate(prompt: string): Promise<string> {
    if (!config.openRouterApiKey) {
      return `[OpenRouter stubbed response] ${prompt.slice(0, 200)}`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        "Content-Type": "application/json",
        // Optional attribution headers can be added here later if desired.
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${text}`);
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part: any) => (typeof part.text === "string" ? part.text : ""))
        .join("\n");
    }

    throw new Error("OpenRouter API returned no content");
  }
}


