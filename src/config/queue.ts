import { Queue } from "bullmq";
import { config } from "./env";
import IORedis from "ioredis";

export const connection = new IORedis(config.redisUrl);

export const PIPELINE_QUEUE_NAME = "pipeline-runs";
export const ORCHESTRATION_QUEUE_NAME = "orchestration-jobs";

export interface PipelineRunJobData {
  runId: string;
}

export const pipelineQueue = new Queue<PipelineRunJobData>(PIPELINE_QUEUE_NAME, {
  connection,
});

export interface OrchestrationJobData {
  userText: string;
}

export const orchestrationQueue = new Queue<OrchestrationJobData>(
  ORCHESTRATION_QUEUE_NAME,
  {
    connection,
  }
);

