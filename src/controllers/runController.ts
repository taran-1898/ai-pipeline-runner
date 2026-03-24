import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { RunService } from "../services/runService";

const startRunSchema = z.object({
  input: z.unknown(),
});

export class RunController {
  constructor(private readonly runService: RunService) {}

  startRun = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const parsed = startRunSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const run = await this.runService.startRun(params.id, parsed.data.input);
    return reply.status(202).send(run);
  };

  getRun = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const run = await this.runService.getRunById(params.id);
    if (!run) {
      return reply.status(404).send({ error: "Run not found" });
    }
    return reply.send(run);
  };

  getRunArtifacts = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const artifacts = await this.runService.getRunArtifacts(params.id);

    if (!artifacts) {
      return reply.status(404).send({ error: "Run not found" });
    }

    return reply.send(artifacts);
  };
}

