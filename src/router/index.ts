import { FastifyInstance } from "fastify";
import { pipelinesRoutes } from "../api/pipelines";
import { runsRoutes } from "../api/runs";
import { interactionsRoutes } from "../api/interactions";
import { modelsRoutes } from "../api/models";
import { sessionsRoutes } from "../api/sessions";

export async function registerRoutes(app: FastifyInstance) {
  await pipelinesRoutes(app);
  await runsRoutes(app);
  await interactionsRoutes(app);
  await modelsRoutes(app);
  await sessionsRoutes(app);
}

