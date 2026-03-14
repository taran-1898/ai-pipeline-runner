export interface LLMProvider {
  generate(prompt: string): Promise<string>;
}

export type TaskCategory = "coding" | "reasoning" | "cheap";

