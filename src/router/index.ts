import { FastifyInstance } from "fastify";
import { pipelinesRoutes } from "../api/pipelines";
import { runsRoutes } from "../api/runs";
import { interactionsRoutes } from "../api/interactions";
import { modelsRoutes } from "../api/models";
import { sessionsRoutes } from "../api/sessions";
import { nodesRoutes } from "../api/nodes";
import { voiceRoutes } from "../api/voice";

export async function registerRoutes(app: FastifyInstance) {
  await pipelinesRoutes(app);
  await runsRoutes(app);
  await interactionsRoutes(app);
  await modelsRoutes(app);
  await sessionsRoutes(app);
  await nodesRoutes(app);
  await voiceRoutes(app);
}

