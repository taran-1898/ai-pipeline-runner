import { Worker, Job } from "bullmq";
import {
  ORCHESTRATION_QUEUE_NAME,
  OrchestrationJobData,
  connection,
} from "../config/queue";
import { OrchestrationService } from "../services/orchestrationService";
import { logger } from "../utils/logger";

const orchestrationService = new OrchestrationService();

/**
 * Orchestration worker:
 * - Takes free-form user text.
 * - Decides which capability to use (LLM vs. external tool vs. pipeline).
 * - Logs the decision and, in simple cases, executes the chosen LLM/tool.
 *
 * This worker is intentionally conservative: it does not yet persist
 * orchestration results, but provides a single place to grow richer planning.
 */
const worker = new Worker<OrchestrationJobData>(
  ORCHESTRATION_QUEUE_NAME,
  async (job: Job<OrchestrationJobData>) => {
    const { userText } = job.data;

    const { decision, provider, tool } =
      orchestrationService.getProviderForUserText(userText);

    logger.info("Processing orchestration job", {
      userTextSnippet: userText.slice(0, 120),
      decision,
    });

    // For now, just execute once and log the output. You can later:
    // - Create pipeline runs based on the decision.
    // - Store orchestration traces in dedicated tables.
    if (provider) {
      const result = await provider.generate(userText);
      logger.info("Orchestration LLM result snippet", {
        snippet: result.slice(0, 200),
      });
    } else if (tool) {
      const result = await tool.invoke(userText);
      logger.info("Orchestration tool result snippet", {
        tool: tool.name,
        snippet: result.slice(0, 200),
      });
    } else {
      logger.error("No provider or tool resolved for orchestration job", {
        decision,
      });
    }
  },
  {
    connection,
  }
);

worker.on("error", (err) => {
  logger.error("Orchestration worker error", err);
});

logger.info("Orchestration worker started");

