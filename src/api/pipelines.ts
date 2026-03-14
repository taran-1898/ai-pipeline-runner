import { FastifyInstance } from "fastify";
import { PipelineController } from "../controllers/pipelineController";
import { PipelineService } from "../services/pipelineService";
import { PipelinePlanningService } from "../services/pipelinePlanningService";
import { PlannerAgent } from "../agents/PlannerAgent";

export async function pipelinesRoutes(app: FastifyInstance) {
  const pipelineService = new PipelineService();
  const plannerAgent = new PlannerAgent();
  const planningService = new PipelinePlanningService(pipelineService, plannerAgent);
  const controller = new PipelineController(pipelineService, planningService);

  app.post("/pipelines", controller.createPipeline);
  app.get("/pipelines", controller.listPipelines);
  app.post("/pipelines/plan", controller.planPipeline);
}

