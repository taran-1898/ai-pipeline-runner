/**
 * Generic abstraction for non-LLM AI tools (search, media, presentations, etc.).
 *
 * Each tool receives a textual description of the user's intent and returns a
 * textual result or summary. You can later extend this interface with richer
 * inputs/outputs per tool type.
 */
export interface AITool {
  readonly name: string;
  invoke(input: string): Promise<string>;
}

