import { SpeechToTextProvider } from "./SpeechToTextProvider";
import { config } from "../config/env";
import { fetch } from "undici";
import * as fs from "node:fs";

/**
 * Whisper-based speech-to-text using OpenAI's audio transcription API.
 *
 * NOTE: For simplicity, this implementation assumes `audioUrlOrPath` is a local
 * file path. In a real system you would handle remote URLs and streams too.
 */
export class WhisperProvider implements SpeechToTextProvider {
  async transcribe(audioUrlOrPath: string): Promise<string> {
    if (!config.whisperApiKey) {
      // Without a key, return a stub so flows can still be exercised.
      return `[Whisper stubbed transcript for ${audioUrlOrPath}]`;
    }

    const fileStream = fs.createReadStream(audioUrlOrPath);
    const form = new FormData();
    form.append("file", fileStream as any);
    form.append("model", "gpt-4o-transcribe");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whisperApiKey}`,
      },
      body: form as any,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Whisper API error: ${response.status} ${text}`);
    }

    const data: any = await response.json();
    if (typeof data.text !== "string") {
      throw new Error("Whisper API returned no transcript");
    }

    return data.text;
  }
}

