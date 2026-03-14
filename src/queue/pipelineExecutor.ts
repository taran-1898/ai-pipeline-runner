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

    for (const step of pipeline.steps) {
      const startedAt = Date.now();

      const stepType = (step.stepType || "generic") as StepType;

      const prompt = this.buildPrompt(step.promptTemplate, {
        input: currentInput,
        stepType,
      });

      const taskCategory =
        stepType === "coder" ? "coding" : stepType === "planner" ? "reasoning" : "cheap";

      const provider = modelRouter.getProviderForTask(taskCategory);

      const response = await provider.generate(prompt);

      const durationMs = Date.now() - startedAt;

      await prisma.runStep.create({
        data: {
          runId: run.id,
          stepId: step.id,
          modelUsed: provider.constructor.name,
          prompt,
          response,
          durationMs,
          tokenCost: null, // TODO: compute from provider usage
        },
      });

      logger.info("Executed pipeline step", {
        runId,
        stepId: step.id,
        model: provider.constructor.name,
        durationMs,
      });

      // For validator steps, run simple validation
      if (stepType === "validator") {
        const validation = validator.validateJsonAgainstSchema(response);
        if (!validation.valid) {
          await prisma.run.update({
            where: { id: run.id },
            data: {
              status: "FAILED",
              finishedAt: new Date(),
            },
          });
          logger.error("Validation failed", { runId, errors: validation.errors });
          return;
        }
      }

      // Pass response to the next step as input
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

