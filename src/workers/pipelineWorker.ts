import { Worker, Job } from "bullmq";
import { PIPELINE_QUEUE_NAME, PipelineRunJobData, connection } from "../config/queue";
import { PipelineExecutor } from "../queue/pipelineExecutor";
import { logger } from "../utils/logger";
import { prisma } from "../config/db";

const executor = new PipelineExecutor();

const worker = new Worker<PipelineRunJobData>(
  PIPELINE_QUEUE_NAME,
  async (job: Job<PipelineRunJobData>) => {
    const { runId } = job.data;

    logger.info("Starting pipeline run", { runId });

    await prisma.run.update({
      where: { id: runId },
      data: { status: "RUNNING" },
    });

    try {
      await executor.executeRun(runId);
      logger.info("Completed pipeline run", { runId });
    } catch (err) {
      logger.error("Pipeline run failed", { runId, error: err });
      await prisma.run.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
        },
      });
      throw err;
    }
  },
  {
    connection,
  }
);

worker.on("error", (err) => {
  logger.error("Worker error", err);
});

logger.info("Pipeline worker started");

