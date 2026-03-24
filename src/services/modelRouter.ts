import { AnthropicProvider } from "../agents/AnthropicProvider";
import { LLMProvider, TaskCategory } from "../agents/LLMProvider";
import { OpenAIProvider } from "../agents/OpenAIProvider";
import { OpenRouterProvider } from "../agents/OpenRouterProvider";
import { prisma } from "../config/db";

export class ModelRouter {
  private readonly openAI: OpenAIProvider;
  private readonly anthropic: AnthropicProvider;
  private readonly openRouter: OpenRouterProvider;

  constructor(deps?: {
    openAI?: OpenAIProvider;
    anthropic?: AnthropicProvider;
    openRouter?: OpenRouterProvider;
  }) {
    this.openAI = deps?.openAI ?? new OpenAIProvider();
    this.anthropic = deps?.anthropic ?? new AnthropicProvider();
    this.openRouter = deps?.openRouter ?? new OpenRouterProvider();
  }

  getProviderForTask(taskCategory: TaskCategory): LLMProvider {
    switch (taskCategory) {
      case "coding":
        return this.anthropic;
      case "reasoning":
        return this.openAI;
      case "cheap":
      default:
        return this.openRouter;
    }
  }

  /**
   * Record basic performance metrics for a model after a step finishes.
   */
  async recordStepMetrics(params: {
    model: string | null;
    success: boolean;
    durationMs: number;
    cost?: number | null;
  }): Promise<void> {
    const { model, success, durationMs, cost } = params;
    if (!model) return;

    const existing = await prisma.modelMetrics.findUnique({
      where: { model },
    });

    if (!existing) {
      await prisma.modelMetrics.create({
        data: {
          model,
          successCount: success ? 1 : 0,
          failureCount: success ? 0 : 1,
          avgLatency: durationMs,
          avgCost: cost ?? null,
        },
      });
      return;
    }

    const prevTotalCount = existing.successCount + existing.failureCount;
    const newTotalCount = prevTotalCount + 1;

    const newSuccessCount = existing.successCount + (success ? 1 : 0);
    const newFailureCount = existing.failureCount + (success ? 0 : 1);

    const newAvgLatency =
      newTotalCount === 0
        ? durationMs
        : (existing.avgLatency * prevTotalCount + durationMs) / newTotalCount;

    let newAvgCost = existing.avgCost ?? null;
    if (typeof cost === "number") {
      const prevCostTotal =
        existing.avgCost != null ? existing.avgCost * prevTotalCount : 0;
      newAvgCost = (prevCostTotal + cost) / newTotalCount;
    }

    await prisma.modelMetrics.update({
      where: { model },
      data: {
        successCount: newSuccessCount,
        failureCount: newFailureCount,
        avgLatency: newAvgLatency,
        avgCost: newAvgCost,
      },
    });
  }
}

