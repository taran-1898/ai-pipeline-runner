import { FastifyInstance } from "fastify";
import { ModelMetricsService } from "../services/modelMetricsService";
import { ModelMetricsController } from "../controllers/modelMetricsController";

export async function modelsRoutes(app: FastifyInstance) {
  const service = new ModelMetricsService();
  const controller = new ModelMetricsController(service);

  app.get("/models/metrics", controller.listMetrics);
}

