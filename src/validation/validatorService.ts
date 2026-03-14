import { z } from "zod";

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export class ValidatorService {
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
}

