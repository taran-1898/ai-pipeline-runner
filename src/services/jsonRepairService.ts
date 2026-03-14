import { ModelRouter } from "./modelRouter";

/**
 * JsonRepairService attempts to fix invalid JSON outputs so that they comply
 * with a given JSON Schema. It uses an LLM via ModelRouter under the hood.
 */
export class JsonRepairService {
  private readonly router: ModelRouter;

  constructor(deps?: { router?: ModelRouter }) {
    this.router = deps?.router ?? new ModelRouter();
  }

  /**
   * Ask an LLM to repair the JSON so that it matches the provided schema and
   * return the repaired JSON string alongside any high-level notes.
   */
  async repair(
    invalidJson: string,
    jsonSchema: unknown,
    validationErrors: string[]
  ): Promise<{ repaired: string; notes: string[] }> {
    const provider = this.router.getProviderForTask("coding");

    const prompt =
      "You are a JSON repair assistant.\n" +
      "Given invalid JSON and a JSON Schema, produce a corrected JSON value that fully satisfies the schema.\n" +
      "Do not include any explanations or comments, only the corrected JSON.\n\n" +
      "JSON Schema:\n" +
      JSON.stringify(jsonSchema, null, 2) +
      "\n\n" +
      "Invalid JSON:\n" +
      invalidJson +
      "\n\n" +
      "Known validation errors:\n" +
      validationErrors.join("\n") +
      "\n\n" +
      "Return ONLY the corrected JSON:";

    const repaired = await provider.generate(prompt);

    return { repaired, notes: validationErrors };
  }
}

