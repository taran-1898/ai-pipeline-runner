import { LLMProvider } from "./LLMProvider";
import { config } from "../config/env";
import { fetch } from "undici";

/**
 * OpenAI provider using the Chat Completions API.
 *
 * This implementation is intentionally minimal – it sends the entire prompt
 * as a single user message and returns the first choice's text content.
 */
export class OpenAIProvider implements LLMProvider {
  async generate(prompt: string): Promise<string> {
    if (!config.openAiApiKey) {
      // Fallback stub to keep local/dev environments usable without keys.
      return `[OpenAI stubbed response] ${prompt.slice(0, 200)}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${text}`);
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      // Handle multi-part content; join text segments for simplicity.
      return content
        .map((part: any) => (typeof part.text === "string" ? part.text : ""))
        .join("\n");
    }

    throw new Error("OpenAI API returned no content");
  }
}

