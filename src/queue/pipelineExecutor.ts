import { prisma } from "../config/db";
import { ModelRouter } from "../services/modelRouter";
import { ValidatorService } from "../validation/validatorService";
import { JsonRepairService } from "../services/jsonRepairService";
import { logger } from "../utils/logger";
import { StepType } from "../models/pipeline";
import { ToolRouter } from "../services/toolRouter";
import { StorageService } from "../services/storageService";

const modelRouter = new ModelRouter();
const toolRouter = new ToolRouter({ modelRouter });
const validator = new ValidatorService();
const jsonRepair = new JsonRepairService();
const storage = new StorageService();

type StepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

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

    const steps = pipeline.steps;
    const stepById = new Map<string, (typeof steps)[number]>();
    const dependencies = new Map<string, string[]>();
    const status = new Map<string, StepStatus>();
    const results = new Map<string, { prompt: string; response: string }>();

    // Build maps and normalize dependsOn. If all dependsOn arrays are empty,
    // fall back to a simple linear chain based on stepOrder.
    let anyDepends = false;
    for (const step of steps) {
      stepById.set(step.id, step);
      const depends = ((step as any).dependsOn as string[] | undefined) ?? [];
      if (depends.length > 0) {
        anyDepends = true;
      }
      dependencies.set(step.id, depends);
      status.set(step.id, "PENDING");
    }

    if (!anyDepends) {
      const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
      dependencies.clear();
      for (let i = 0; i < sorted.length; i++) {
        const prev = i > 0 ? sorted[i - 1].id : null;
        dependencies.set(sorted[i].id, prev ? [prev] : []);
      }
    }

    const allStepIds = [...stepById.keys()];

    const getRunnableSteps = () =>
      allStepIds.filter((id) => {
        if (status.get(id) !== "PENDING") return false;
        const deps = dependencies.get(id) ?? [];
        return deps.every((d) => status.get(d) === "COMPLETED");
      });

    const total = allStepIds.length;
    let completedCount = 0;

    while (completedCount < total) {
      const runnable = getRunnableSteps();
      if (runnable.length === 0) {
        // Deadlock or unresolved dependencies.
        logger.error("No runnable steps found; possible cyclic dependencies", {
          runId,
        });
        await prisma.run.update({
          where: { id: runId },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
          },
        });
        return;
      }

      await Promise.all(
        runnable.map(async (stepId) => {
          const step = stepById.get(stepId)!;
          status.set(stepId, "RUNNING");

          const deps = dependencies.get(stepId) ?? [];
          let input: unknown = run.input;
          if (deps.length === 1) {
            input = results.get(deps[0])?.response ?? run.input;
          } else if (deps.length > 1) {
            input = deps.map((d) => results.get(d)?.response);
          }

          const startedAt = new Date();
          const rawStepType = ((step as any).stepType || "generic") as string;
          const stepType = rawStepType.toLowerCase() as StepType;

          let prompt: string;

          if (stepType === "reviewer") {
            const lastDep = deps[deps.length - 1];
            const target = results.get(lastDep);
            const originalPrompt = target?.prompt ?? "";
            const originalResponse = target?.response ?? JSON.stringify(input);
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
            const lastDep = deps[deps.length - 1];
            const target = results.get(lastDep);
            const originalPrompt = target?.prompt ?? "";
            const originalResponse = target?.response ?? JSON.stringify(input);
            prompt =
              "You are a fixer in a maker-checker flow.\n" +
              "Given the original prompt and the previous output, produce a corrected output.\n\n" +
              `Original prompt:\n${originalPrompt}\n\n` +
              `Previous output:\n${originalResponse}\n\n` +
              "Return ONLY the corrected output, with no additional commentary.";
          } else {
            prompt = this.buildPrompt(step.promptTemplate, {
              input,
              stepType,
            });
          }

          let response: string;
          let reviewStatus: string | null = null;
          let reviewComments: string | null = null;
          let validationErrors: string[] | null = null;
          let modelOrToolUsed: string | null = null;
          let artifactType: "text" | "file" | "image" | "audio" | "video" = "text";

          try {
            if (stepType === "tool") {
              const toolResult = await toolRouter.route(prompt);
              response = toolResult.response;
              modelOrToolUsed = toolResult.name;
              artifactType = toolResult.artifactType;
            } else {
              const taskCategory =
                stepType === "coder" || stepType === "test_generator" || stepType === "fixer"
                  ? "coding"
                  : stepType === "planner" || stepType === "reviewer"
                  ? "reasoning"
                  : "cheap";

              const provider = modelRouter.getProviderForTask(taskCategory);
              response = await provider.generate(prompt);
              modelOrToolUsed = provider.constructor.name;
              artifactType = "text";
            }

            // Schema validation + repair
            if ((step as any).schema) {
              const schema = (step as any).schema as unknown;
              const basic = validator.validateJsonAgainstJsonSchema(response, schema);
              if (!basic.valid) {
                const repairResult = await jsonRepair.repair(
                  response,
                  schema,
                  basic.errors
                );
                const repairedValidation = validator.validateJsonAgainstJsonSchema(
                  repairResult.repaired,
                  schema
                );

                if (!repairedValidation.valid) {
                  validationErrors = [...basic.errors, ...repairedValidation.errors];
                  const endedAt = new Date();
                  const durationMs = endedAt.getTime() - startedAt.getTime();

                  await prisma.runStep.create({
                    data: {
                      runId: run.id,
                      stepId: step.id,
                      modelUsed: modelOrToolUsed,
                      prompt,
                      response: repairResult.repaired,
                      tokenCost: null,
                      durationMs,
                      reviewStatus: null,
                      reviewComments: null,
                      validationErrors: JSON.stringify(validationErrors),
                      status: "FAILED",
                      startTime: startedAt,
                      endTime: endedAt,
                    },
                  });

                  await prisma.run.update({
                    where: { id: run.id },
                    data: {
                      status: "FAILED",
                      finishedAt: new Date(),
                    },
                  });

                  logger.error("Schema validation failed after repair", {
                    runId,
                    stepId: step.id,
                    errors: validationErrors,
                  });

                  status.set(stepId, "FAILED");

                  // Record failure metrics for the model, if applicable.
                  if (modelOrToolUsed) {
                    await modelRouter.recordStepMetrics({
                      model: modelOrToolUsed,
                      success: false,
                      durationMs,
                      cost: null,
                    });
                  }
                  throw new Error("Schema validation failed after repair");
                }

                response = repairResult.repaired;
                validationErrors = basic.errors;
              }
            }

            // Reviewer parsing
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
            }

            // Validator step (LLM-based)
            if (stepType === "validator") {
              const basic = validator.validateJsonAgainstSchema(response);
              let finalResult = basic;

              if (basic.valid) {
                const llmResult = await validator.validateWithLlm(
                  response,
                  "Output should be valid, coherent, and match the intended task."
                );
                finalResult = llmResult;
              }

              if (!finalResult.valid) {
                validationErrors = finalResult.errors;
                const endedAt = new Date();
                const durationMs = endedAt.getTime() - startedAt.getTime();

                await prisma.runStep.create({
                  data: {
                    runId: run.id,
                    stepId: step.id,
                    modelUsed: modelOrToolUsed,
                    prompt,
                    response,
                    tokenCost: null,
                    durationMs,
                    reviewStatus,
                    reviewComments,
                    validationErrors: JSON.stringify(validationErrors),
                    status: "FAILED",
                    startTime: startedAt,
                    endTime: endedAt,
                  },
                });

                await prisma.run.update({
                  where: { id: run.id },
                  data: {
                    status: "FAILED",
                    finishedAt: new Date(),
                  },
                });

                logger.error("Validation failed", {
                  runId,
                  errors: finalResult.errors,
                });

                status.set(stepId, "FAILED");

                // Record failure metrics for the model, if applicable.
                if (modelOrToolUsed) {
                  await modelRouter.recordStepMetrics({
                    model: modelOrToolUsed,
                    success: false,
                    durationMs,
                    cost: null,
                  });
                }
                throw new Error("Validator step failed");
              }
            }

            const endedAt = new Date();
            const durationMs = endedAt.getTime() - startedAt.getTime();

            await prisma.runStep.create({
              data: {
                runId: run.id,
                stepId: step.id,
                modelUsed: modelOrToolUsed,
                prompt,
                response,
                tokenCost: null,
                durationMs,
                reviewStatus,
                reviewComments,
                validationErrors: validationErrors
                  ? JSON.stringify(validationErrors)
                  : null,
                status: "COMPLETED",
                startTime: startedAt,
                endTime: endedAt,
              },
            });

            // Store artifact in Cloudflare R2 and persist metadata.
            try {
              const artifactBuffer = Buffer.from(response, "utf8");
              const key = `${run.id}/${step.id}/${startedAt.getTime()}.txt`;
              const fileUrl = await storage.uploadArtifact(
                artifactBuffer,
                key,
                "text/plain; charset=utf-8"
              );

              await (prisma as any).runArtifact.create({
                data: {
                  runId: run.id,
                  type:
                    artifactType === "file"
                      ? "document"
                      : artifactType === "text"
                      ? "text"
                      : artifactType,
                  fileKey: key,
                  fileUrl,
                  metadata: {
                    stepId: step.id,
                    stepType,
                    modelOrToolUsed,
                  },
                },
              });
            } catch (storageErr) {
              logger.error("Failed to persist run artifact to storage", {
                runId,
                stepId: step.id,
                error: storageErr,
              });
            }

            // Record success metrics for the model, if applicable.
            if (modelOrToolUsed) {
              await modelRouter.recordStepMetrics({
                model: modelOrToolUsed,
                success: true,
                durationMs,
                cost: null,
              });
            }

            logger.info(
              stepType === "tool" ? "Executed tool pipeline step" : "Executed pipeline step",
              {
                runId,
                stepId: step.id,
                modelOrTool: modelOrToolUsed,
                stepType,
                durationMs,
              }
            );

            results.set(stepId, { prompt, response });
            status.set(stepId, "COMPLETED");
          } catch (err) {
            const endedAt = new Date();
            const durationMs = endedAt.getTime() - startedAt.getTime();

            logger.error("Step execution failed", { runId, stepId, error: err });
            status.set(stepId, "FAILED");

            // Record failure metrics for the model, if applicable.
            if (modelOrToolUsed) {
              await modelRouter.recordStepMetrics({
                model: modelOrToolUsed,
                success: false,
                durationMs,
                cost: null,
              });
            }

            throw err;
          }
        })
      );

      completedCount = allStepIds.filter((id) => status.get(id) === "COMPLETED").length;
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

