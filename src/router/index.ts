import { FastifyInstance } from "fastify";
import { pipelinesRoutes } from "../api/pipelines";
import { runsRoutes } from "../api/runs";
import { interactionsRoutes } from "../api/interactions";
import { modelsRoutes } from "../api/models";
import { sessionsRoutes } from "../api/sessions";
import { nodesRoutes } from "../api/nodes";
import { voiceRoutes } from "../api/voice";
import { logger } from "../utils/logger";

export async function registerRoutes(app: FastifyInstance) {
  // Global request logger
  app.addHook("onRequest", async (request) => {
    logger.info(`→ ${request.method} ${request.url}`, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
  });

  // Global response logger
  app.addHook("onSend", async (request, reply) => {
    logger.info(`← ${request.method} ${request.url} ${reply.statusCode}`);
  });

  await pipelinesRoutes(app);
  await runsRoutes(app);
  await interactionsRoutes(app);
  await modelsRoutes(app);
  await sessionsRoutes(app);
  await nodesRoutes(app);
  await voiceRoutes(app);
}


