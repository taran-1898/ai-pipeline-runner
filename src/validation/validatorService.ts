import { z } from "zod";
import { ModelRouter } from "../services/modelRouter";

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

/**
 * ValidatorService supports both local JSON/schema validation and
 * LLM-based validation via the existing ModelRouter.
 */
export class ValidatorService {
  private readonly router: ModelRouter;

  constructor(deps?: { router?: ModelRouter }) {
    this.router = deps?.router ?? new ModelRouter();
  }

  // Basic JSON structure validation hook for "validator" steps
  validateJsonAgainstSchema(response: string, schema?: z.ZodTypeAny): ValidationResult {
    if (!schema) {
      // No schema provided, just ensure it's valid JSON
      try {
        JSON.parse(response);
        return { valid: true };
      } catch (err) {
        return { valid: false, errors: ["Response is not valid JSON"] };
      }
    }

    try {
      const json = JSON.parse(response);
      const result = schema.safeParse(json);
      if (!result.success) {
        return {
          valid: false,
          errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        };
      }
      return { valid: true };
    } catch (err) {
      return { valid: false, errors: ["Response is not valid JSON"] };
    }
  }

  /**
   * LLM-based validation: asks a reasoning model to judge whether the
   * response satisfies the provided criteria and expects a strict JSON
   * result. Keeps overall behavior deterministic by enforcing a narrow
   * output format.
   */
  async validateWithLlm(
    response: string,
    criteria: string
  ): Promise<ValidationResult> {
    const provider = this.router.getProviderForTask("reasoning");

    const prompt =
      "You are a strict validator. Given a model response and validation criteria,\n" +
      "decide whether the response is acceptable.\n\n" +
      `Criteria:\n${criteria}\n\n` +
      "Response to validate:\n" +
      response +
      "\n\nReturn ONLY a JSON object with this exact shape:\n" +
      '{ "isValid": boolean, "errors": string[] }\n';

    const raw = await provider.generate(prompt);

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.isValid === "boolean" && Array.isArray(parsed.errors)) {
        return parsed.isValid
          ? { valid: true }
          : { valid: false, errors: parsed.errors.map(String) };
      }
      return {
        valid: false,
        errors: ["LLM validator returned an unexpected structure"],
      };
    } catch {
      return {
        valid: false,
        errors: ["LLM validator returned non-JSON output"],
      };
    }
  }
}

