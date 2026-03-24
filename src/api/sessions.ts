import { FastifyInstance } from "fastify";
import { ConversationService } from "../services/conversationService";
import { SessionController } from "../controllers/sessionController";

export async function sessionsRoutes(app: FastifyInstance) {
  const conversation = new ConversationService();
  const controller = new SessionController(conversation);

  app.post("/sessions", controller.createSession);
  app.post("/sessions/:id/message", controller.appendMessage);
  app.get("/sessions/:id/history", controller.getHistory);
}

