import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { PipelineService } from "../services/pipelineService";

const createPipelineSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        stepType: z.string(),
        task: z.string(),
        promptTemplate: z.string(),
      })
    )
    .min(1),
});

export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

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
}

