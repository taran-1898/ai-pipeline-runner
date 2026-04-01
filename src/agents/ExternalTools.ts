import { AITool } from "./AITool";
import { config } from "../config/env";
import { StorageService } from "../services/storageService";
import { randomUUID } from "node:crypto";

/**
 * The following tool wrappers are intentionally thin and mostly stubbed.
 * They provide a clear integration point and naming, and can be filled in
 * with real HTTP calls as needed.
 */

abstract class BaseTool implements AITool {
  abstract readonly name: string;
  protected abstract hasApiKey(): boolean;
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${config.geminiApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: input }] }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
    }
    
    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "[Empty Gemini response]";
  }
}

export class BananaTool extends BaseTool {
  readonly name = "banana";
  protected hasApiKey(): boolean {
    return !!config.bananaApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // Stubbed: Awaiting headless server payload spec
    return `[Banana real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class FlowTool extends BaseTool {
  readonly name = "flow";
  protected hasApiKey(): boolean {
    return !!config.flowApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // Stubbed: Awaiting Flowise projection payload mapping
    return `[Flow real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class RunwayTool extends BaseTool {
  readonly name = "runway";
  protected hasApiKey(): boolean {
    return !!config.runwayApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // Stubbed: Awaiting streaming URL callback logic
    return `[Runway real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class ElevenLabsTool extends BaseTool {
  readonly name = "elevenlabs";
  protected hasApiKey(): boolean {
    return !!config.elevenLabsApiKey;
  }
  
  protected async callProvider(input: string): Promise<string> {
    // Basic text-to-speech using Rachel's voice ID
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
      method: "POST",
      headers: {
        "xi-api-key": config.elevenLabsApiKey!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: input,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${await response.text()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const storage = new StorageService();
    const url = await storage.uploadArtifact(buffer, `tts/${randomUUID()}.mp3`, "audio/mpeg");
    
    return `Audio generated successfully! You can listen here: ${url}`;
  }
}

export class PerplexityTool extends BaseTool {
  readonly name = "perplexity";
  protected hasApiKey(): boolean {
    return !!config.perplexityApiKey;
  }
  
  protected async callProvider(input: string): Promise<string> {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${config.perplexityApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "user", content: input }]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${await response.text()}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || "[Empty Perplexity response]";
  }
}

export class FathomTool extends BaseTool {
  readonly name = "fathom";
  protected hasApiKey(): boolean {
    return !!config.fathomApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // Stubbed: Awaiting deeper analytics structure reporting
    return `[Fathom real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class GammaTool extends BaseTool {
  readonly name = "gamma";
  protected hasApiKey(): boolean {
    return !!config.gammaApiKey;
  }
  protected async callProvider(input: string): Promise<string> {
    // Stubbed: No public REST generation SDK currently natively supported
    return `[Gamma real call not yet implemented] ${input.slice(0, 200)}`;
  }
}

export class CursorTool extends BaseTool {
  readonly name = "cursor";
  protected hasApiKey(): boolean {
    return true; // No API key required for local filesystem hydration
  }
  protected async callProvider(input: string): Promise<string> {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const os = await import("node:os");
    const { exec } = await import("node:child_process");

    const projectsDir = path.join(os.homedir(), "Desktop", "ai-projects");

    // Attempt to read existing project directories to feed as context
    let existingProjects: string[] = [];
    try {
      await fs.access(projectsDir);
      const items = await fs.readdir(projectsDir, { withFileTypes: true });
      existingProjects = items.filter((item: any) => item.isDirectory()).map((item: any) => item.name);
    } catch {
      // If the base directory doesn't exist yet, it's fine
    }

    const { AnthropicProvider } = await import("./AnthropicProvider");
    const llm = new AnthropicProvider();

    const parsePrompt = `
You are a project intent parser. The user wants to run a coding agent on a project.
Analyze the user request and return ONLY a JSON object with this exact structure (no markdown fences, just pure JSON):
{
  "isNewProject": boolean,
  "projectName": "matched-or-new-name",
  "instructions": "the core development instructions for cursor",
  "mode": "cursor | antigravity"
}

Existing projects on disk:
${existingProjects.length > 0 ? JSON.stringify(existingProjects) : "None"}

Rules:
- If use intent matches EXISTING, set "projectName" strictly to that name, and "isNewProject" to false.
- If it is a new app, generate a concise lowercase-dash-separated-name.
- Set "mode" to "cursor" if the task seems like it needs human oversight or complex multi-file orchestration.
- Set "mode" to "antigravity" if the task is simple, or if the user explicitly mentions "antigravity".
User request: ${input}`;

    let parsed: { isNewProject: boolean, projectName: string, instructions: string, mode: "cursor" | "antigravity" };
    
    try {
      const jsonString = await llm.generate(parsePrompt);
      const cleaned = jsonString.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.warn("LLM intent parsing failed for Cursor context, using fallback.", err);
      parsed = {
        isNewProject: true,
        projectName: "cursor-" + randomUUID().slice(0, 6),
        instructions: input,
        mode: "cursor"
      };
    }

    const projectPath = path.join(projectsDir, parsed.projectName);

    try {
      await fs.access(projectPath);
    } catch {
      await fs.mkdir(projectPath, { recursive: true });
    }

    // Always seed the instruction file and .cursorrules
    const rules = `
You are a helpful Cursor AI assistant initialized by the AI Pipeline Runner. 
Please refer to the .cursor_instructions.md file for the exact PRD and active task specifications.
`;
    await fs.writeFile(path.join(projectPath, ".cursor_instructions.md"), `# Active Task\n\n${parsed.instructions}`);
    await fs.writeFile(path.join(projectPath, ".cursorrules"), rules.trim());

    if (parsed.mode === "cursor") {
      return new Promise((resolve) => {
        exec(`cursor "${projectPath}"`, async (error) => {
          if (error) {
            console.error("Failed to launch cursor, falling back to Antigravity mode:", error);
            const result = await this.runAntigravityMode(parsed.instructions, projectPath, llm);
            resolve(`[CursorTool] Cursor launch failed. ${result}`);
          } else {
            resolve(`[CursorTool] Hydrated workspace at ${projectPath}. Cursor IDE launched.`);
          }
        });
      });
    } else {
      const result = await this.runAntigravityMode(parsed.instructions, projectPath, llm);
      return `[CursorTool] Antigravity mode activated. ${result}`;
    }
  }

  private async runAntigravityMode(instructions: string, projectPath: string, llm: any): Promise<string> {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const genPrompt = `
You are a lead developer (Antigravity). Based on these instructions, generate the INITIAL files for the project. 
Return ONLY a JSON object where keys are relative file paths and values are file contents. 
Instructions: ${instructions}

Example: {"src/index.ts": "console.log('hi')", "package.json": "{...}"}
`;
    try {
      const jsonString = await llm.generate(genPrompt);
      const cleaned = jsonString.replace(/```json/gi, "").replace(/```/g, "").trim();
      const files: Record<string, string> = JSON.parse(cleaned);

      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(projectPath, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      }

      return `Successfully generated ${Object.keys(files).length} files in ${projectPath} using Antigravity AI.`;
    } catch (err) {
      console.error("Antigravity file generation failed.", err);
      return `Antigravity mode failed to generate files: ${err instanceof Error ? err.message : "unknown error"}`;
    }
  }
}
