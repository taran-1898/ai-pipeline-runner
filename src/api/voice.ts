import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { OrchestrationService } from "../services/orchestrationService";
import { StorageService } from "../services/storageService";
import { WhisperProvider } from "../agents/WhisperProvider";
import { logger } from "../utils/logger";
import { PipelinePlanningService } from "../services/pipelinePlanningService";
import { PipelineService } from "../services/pipelineService";
import { PlannerAgent } from "../agents/PlannerAgent";
import { RunService } from "../services/runService";

export async function voiceRoutes(app: FastifyInstance) {
  const orchestrationService = new OrchestrationService();
  const storageService = new StorageService();
  const whisperProvider = new WhisperProvider();
  
  // Dependencies required by handleVoiceCommand
  const pipelineService = new PipelineService();
  const plannerAgent = new PlannerAgent();
  const planningService = new PipelinePlanningService(pipelineService, plannerAgent);
  const runService = new RunService();

  app.post("/voice", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get multipart data
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "Missing 'audio' file in multipart data" });
      }

      const audioBuffer = await data.toBuffer();
      const mimeType = data.mimetype;
      const originalName = data.filename || "audio.wav";
      
      logger.info("Received voice upload", { bytes: audioBuffer.length, mimeType, filename: originalName });

      // Ensure providers that support transcribeBuffer work here
      let transcript = "";
      if (whisperProvider.transcribeBuffer) {
        transcript = await whisperProvider.transcribeBuffer(audioBuffer, mimeType);
      } else {
        return reply.status(500).send({ error: "WhisperProvider does not support buffer transcription" });
      }
      
      logger.info("Audio transcribed successfully", { transcriptSnippet: transcript.slice(0, 100) });

      // Run orchestration
      const { pipelineGenerated, runId } = await orchestrationService.handleVoiceCommand(
        transcript,
        planningService,
        runService
      );

      // Async upload to R2 for persistence. 
      // We do this concurrently to not block the response after pipeline generation is done.
      const timestamp = new Date().getTime();
      const s3Key = `voice_inputs/${timestamp}_${originalName}`;
      storageService.uploadArtifact(audioBuffer, s3Key, mimeType)
        .then(url => logger.info("Uploaded voice input to R2", { url }))
        .catch(err => logger.error("Failed to upload voice to R2", err));

      return reply.status(200).send({
        transcript,
        pipelineGenerated,
        runId
      });

    } catch (error: any) {
      logger.error("Failed to process /voice request", error);
      return reply.status(500).send({ error: error.message });
    }
  });
}
