import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { PipelineService } from "../services/pipelineService";
import { PipelinePlanningService } from "../services/pipelinePlanningService";
import { StepType } from "../models/pipeline";

const createPipelineSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        stepType: z.custom<StepType>(),
        task: z.string(),
        promptTemplate: z.string(),
      })
    )
    .min(1),
});

const planPipelineSchema = z.object({
  task: z.string(),
});

export class PipelineController {
  constructor(
    private readonly pipelineService: PipelineService,
    private readonly planningService?: PipelinePlanningService
  ) {}

  createPipeline = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createPipelineSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const pipeline = await this.pipelineService.createPipeline(parsed.data);
    return reply.status(201).send(pipeline);
  };

  listPipelines = async (_request: FastifyRequest, reply: FastifyReply) => {
    const pipelines = await this.pipelineService.listPipelines();
    return reply.send(pipelines);
  };

  planPipeline = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!this.planningService) {
      return reply
        .status(500)
        .send({ error: "Planning service not configured on this instance" });
    }

    const parsed = planPipelineSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const pipeline = await this.planningService.planAndCreate(parsed.data.task);
    return reply.status(201).send(pipeline);
  };
}

