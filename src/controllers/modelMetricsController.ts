import { FastifyRequest, FastifyReply } from "fastify";
import { ModelMetricsService } from "../services/modelMetricsService";

export class ModelMetricsController {
  constructor(private readonly service: ModelMetricsService) {}

  listMetrics = async (_request: FastifyRequest, reply: FastifyReply) => {
    const metrics = await this.service.listMetrics();
    return reply.send(metrics);
  };
}

