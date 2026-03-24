import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ConversationService } from "../services/conversationService";

const appendMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export class SessionController {
  constructor(private readonly conversation: ConversationService) {}

  createSession = async (_request: FastifyRequest, reply: FastifyReply) => {
    const session = await this.conversation.createSession();
    return reply.status(201).send(session);
  };

  appendMessage = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = appendMessageSchema.safeParse(request.body);

    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const message = await this.conversation.appendMessage(
      params.id,
      body.data.role,
      body.data.content
    );

    return reply.status(201).send(message);
  };

  getHistory = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = z.object({ id: z.string() }).parse(request.params);

    const history = await this.conversation.getConversationHistory(params.id);
    return reply.send(history);
  };
}

