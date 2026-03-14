import { FastifyInstance } from "fastify";
import { InteractionController } from "../controllers/interactionController";

export async function interactionsRoutes(app: FastifyInstance) {
  const controller = new InteractionController();
  app.post("/interactions", controller.handleInteraction);
}

