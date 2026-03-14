import { LLMProvider } from "./LLMProvider";
import { config } from "../config/env";
import { fetch } from "undici";

/**
 * Anthropic provider using the Messages API.
 *
 * Sends the prompt as a single user message and returns the concatenated text
 * from the first message's content blocks.
 */
export class AnthropicProvider implements LLMProvider {
  async generate(prompt: string): Promise<string> {
    if (!config.anthropicApiKey) {
      return `[Anthropic stubbed response] ${prompt.slice(0, 200)}`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${text}`);
    }

    const data: any = await response.json();
    const contentBlocks = data.content;

    if (!Array.isArray(contentBlocks)) {
      throw new Error("Anthropic API returned unexpected content format");
    }

    const text = contentBlocks
      .map((block: any) => {
        if (block.type === "text" && typeof block.text === "string") {
          return block.text;
        }
        return "";
      })
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Anthropic API returned empty content");
    }

    return text;
  }
}

