import { prisma } from "../config/db";
import { ModelRouter } from "../services/modelRouter";
import { ValidatorService } from "../validation/validatorService";
import { logger } from "../utils/logger";
import { StepType } from "../models/pipeline";

const modelRouter = new ModelRouter();
const validator = new ValidatorService();

export class PipelineExecutor {
  async executeRun(runId: string): Promise<void> {
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        pipeline: {
          include: { steps: { orderBy: { stepOrder: "asc" } } },
        },
      },
    });

    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    const { pipeline } = run;
    if (!pipeline) {
      throw new Error(`Pipeline for run ${runId} not found`);
    }

    let currentInput = run.input;
    let lastPrompt: string | null = null;
    let lastResponse: string | null = null;
    let lastReviewStatus: string | null = null;
    let lastReviewComments: string | null = null;

    for (const step of pipeline.steps) {
      const startedAt = Date.now();

      const stepType = (step.stepType || "generic") as StepType;

      let prompt: string;

      // For reviewer steps, build a prompt that includes both the original
      // prompt and the output being reviewed.
      if (stepType === "reviewer") {
        const originalPrompt = lastPrompt ?? "";
        const originalResponse = lastResponse ?? JSON.stringify(currentInput);
        prompt =
          "You are a strict reviewer in a maker-checker flow.\n" +
          "Given the original prompt and the model output, decide whether the output is acceptable.\n\n" +
          "Return ONLY one of the following formats:\n" +
          '1) "APPROVED"\n' +
          '2) "REJECTED: <short explanation>"\n\n' +
          `Original prompt:\n${originalPrompt}\n\n` +
          `Output:\n${originalResponse}\n\n` +
          "Decision:";
      } else if (stepType === "fixer") {
        const originalPrompt = lastPrompt ?? "";
        const originalResponse = lastResponse ?? JSON.stringify(currentInput);
        const reviewComments = lastReviewComments ?? "";
        prompt =
          "You are a fixer in a maker-checker flow.\n" +
          "Given the original prompt, the previous output, and review comments, produce a corrected output.\n\n" +
          `Original prompt:\n${originalPrompt}\n\n` +
          `Previous output:\n${originalResponse}\n\n` +
          `Review comments:\n${reviewComments}\n\n` +
          "Return ONLY the corrected output, with no additional commentary.";
      } else {
        prompt = this.buildPrompt(step.promptTemplate, {
          input: currentInput,
          stepType,
        });
      }

      const taskCategory =
        stepType === "coder" || stepType === "test_generator" || stepType === "fixer"
          ? "coding"
          : stepType === "planner" || stepType === "reviewer"
          ? "reasoning"
          : "cheap";

      const provider = modelRouter.getProviderForTask(taskCategory);

      const response = await provider.generate(prompt);

      const durationMs = Date.now() - startedAt;

      let reviewStatus: string | null = null;
      let reviewComments: string | null = null;

      // Parse reviewer decisions into a structured status/comments pair.
      if (stepType === "reviewer") {
        const trimmed = response.trim();
        if (trimmed.toUpperCase().startsWith("APPROVED")) {
          reviewStatus = "APPROVED";
          reviewComments = "";
        } else if (trimmed.toUpperCase().startsWith("REJECTED")) {
          reviewStatus = "REJECTED";
          const parts = trimmed.split(":");
          reviewComments = parts.slice(1).join(":").trim();
        } else {
          reviewStatus = "REJECTED";
          reviewComments = "Reviewer returned an unexpected format.";
        }
        lastReviewStatus = reviewStatus;
        lastReviewComments = reviewComments;
      }

      await prisma.runStep.create({
        data: {
          runId: run.id,
          stepId: step.id,
          modelUsed: provider.constructor.name,
          prompt,
          response,
          durationMs,
          tokenCost: null, // TODO: compute from provider usage
          reviewStatus,
          reviewComments,
        },
      });

      logger.info("Executed pipeline step", {
        runId,
        stepId: step.id,
        model: provider.constructor.name,
        durationMs,
      });

      // For validator steps, run validation (JSON + LLM-based sanity check).
      if (stepType === "validator") {
        const basic = validator.validateJsonAgainstSchema(response);
        let finalResult = basic;

        if (basic.valid) {
          // Only call the LLM validator if the cheap checks pass.
          const llmResult = await validator.validateWithLlm(
            response,
            "Output should be valid, coherent, and match the intended task."
          );
          finalResult = llmResult;
        }

        if (!finalResult.valid) {
          await prisma.run.update({
            where: { id: run.id },
            data: {
              status: "FAILED",
              finishedAt: new Date(),
            },
          });
          logger.error("Validation failed", { runId, errors: finalResult.errors });
          return;
        }
      }

      // Update context for subsequent steps.
      lastPrompt = prompt;
      lastResponse = response;

      // Pass response to the next step as input (maker-checker flows rely on this).
      currentInput = response;
    }

    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
      },
    });
  }

  private buildPrompt(template: string, context: { input: unknown; stepType: StepType }) {
    return template
      .replace("{{input}}", JSON.stringify(context.input))
      .replace("{{stepType}}", context.stepType);
  }
}

