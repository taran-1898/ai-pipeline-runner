import { FastifyInstance } from "fastify";
import { PipelineController } from "../controllers/pipelineController";
import { PipelineService } from "../services/pipelineService";

export async function pipelinesRoutes(app: FastifyInstance) {
  const pipelineService = new PipelineService();
  const controller = new PipelineController(pipelineService);

  app.post("/pipelines", controller.createPipeline);
  app.get("/pipelines", controller.listPipelines);
}

