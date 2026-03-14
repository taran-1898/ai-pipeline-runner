import Fastify from "fastify";
import { config } from "./config/env";
import { registerRoutes } from "./router";
import { logger } from "./utils/logger";

async function buildServer() {
  const app = Fastify({
    logger: false,
  });

  // Basic health route and main API routes
  const { healthRoutes } = await import("./api/health");
  await healthRoutes(app);
  await registerRoutes(app);

  return app;
}

async function start() {
  const app = await buildServer();

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    logger.info(`Server listening on port ${config.port}`);
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

start();

