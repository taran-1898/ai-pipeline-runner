import { FastifyInstance } from "fastify";
import { RunController } from "../controllers/runController";
import { RunService } from "../services/runService";

export async function runsRoutes(app: FastifyInstance) {
  const runService = new RunService();
  const controller = new RunController(runService);

  app.post("/pipelines/:id/run", controller.startRun);
  app.get("/runs/:id", controller.getRun);
}

