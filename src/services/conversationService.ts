import { prisma } from "../config/db";

export type ConversationRole = "user" | "assistant" | "system";

export class ConversationService {
  async createSession() {
    const session = await prisma.conversationSession.create({
      data: {},
    });
    return session;
  }

  async appendMessage(sessionId: string, role: ConversationRole, content: string) {
    const message = await prisma.conversationMessage.create({
      data: {
        sessionId,
        role,
        content,
      },
    });

    await prisma.conversationSession.update({
      where: { id: sessionId },
      data: {
        lastActiveAt: new Date(),
      },
    });

    return message;
  }

  async getConversationHistory(sessionId: string) {
    return prisma.conversationMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateContext(sessionId: string, context: unknown) {
    await prisma.conversationSession.update({
      where: { id: sessionId },
      data: {
        contextJson: context as any,
        lastActiveAt: new Date(),
      },
    });
  }

  async getContext(sessionId: string) {
    const session = await prisma.conversationSession.findUnique({
      where: { id: sessionId },
    });
    return session?.contextJson ?? null;
  }
}

