import { Queue } from "bullmq";
import { config } from "./env";
import type { QueueOptions } from "bullmq";

// Shared BullMQ connection options. We explicitly set maxRetriesPerRequest to
// null as required by BullMQ when using ioredis defaults.
export const connection: QueueOptions["connection"] = {
  url: config.redisUrl,
  maxRetriesPerRequest: null,
  tls: {}
};

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

