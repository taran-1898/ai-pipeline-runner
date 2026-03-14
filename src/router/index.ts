import { FastifyInstance } from "fastify";
import { pipelinesRoutes } from "../api/pipelines";
import { runsRoutes } from "../api/runs";
import { interactionsRoutes } from "../api/interactions";

export async function registerRoutes(app: FastifyInstance) {
  await pipelinesRoutes(app);
  await runsRoutes(app);
  await interactionsRoutes(app);
}

