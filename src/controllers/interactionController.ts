import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { orchestrationQueue } from "../config/queue";
import { OrchestrationService } from "../services/orchestrationService";

const interactionSchema = z.object({
  text: z.string().optional(),
  audioPath: z.string().optional(),
});

/**
 * Controller for "front door" user interactions.
 *
 * It accepts either text or a path to an audio file, performs optional
 * transcription via Whisper, and enqueues an orchestration job.
 */
export class InteractionController {
  private readonly orchestration = new OrchestrationService();

  handleInteraction = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = interactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { text, audioPath } = parsed.data;

    if (!text && !audioPath) {
      return reply
        .status(400)
        .send({ error: "Provide either text or audioPath" });
    }

    const userText = await this.orchestration.transcribeIfNeeded(
      text ?? audioPath!,
      !text && !!audioPath
    );

    await orchestrationQueue.add("interaction", { userText });

    return reply.status(202).send({ enqueued: true });
  };
}

