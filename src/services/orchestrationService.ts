import { ModelRouter } from "./modelRouter";
import { WhisperProvider } from "../agents/WhisperProvider";
import { logger } from "../utils/logger";
import { ConversationService } from "./conversationService";
import {
  CursorTool,
  ElevenLabsTool,
  FathomTool,
  FlowTool,
  GammaTool,
  GeminiTool,
  PerplexityTool,
  RunwayTool,
  BananaTool,
} from "../agents/ExternalTools";

export type OrchestrationDecision =
  | { kind: "pipeline"; taskCategory: string; reason: string }
  | { kind: "tool"; toolName: string; reason: string }
  | { kind: "llm"; providerName: string; reason: string };

/**
 * OrchestrationService is responsible for:
 * 1. Understanding raw user input (optionally via Whisper).
 * 2. Deciding which capability to use (LLM vs. external tool vs. pipeline).
 * 3. Returning a decision that workers or controllers can act on.
 */
export class OrchestrationService {
  private readonly router = new ModelRouter();
  private readonly whisper = new WhisperProvider();
  private readonly conversation = new ConversationService();
  private readonly conversation = new ConversationService();

  // Registry of additional AI tools for non-LLM capabilities.
  private readonly tools = [
    new GeminiTool(),
    new BananaTool(),
    new FlowTool(),
    new RunwayTool(),
    new ElevenLabsTool(),
    new PerplexityTool(),
    new FathomTool(),
    new GammaTool(),
    new CursorTool(),
  ];

  async transcribeIfNeeded(textOrAudioPath: string, isAudio: boolean): Promise<string> {
    if (!isAudio) {
      return textOrAudioPath;
    }
    const transcript = await this.whisper.transcribe(textOrAudioPath);
    logger.info("Transcribed user audio", { transcriptSnippet: transcript.slice(0, 120) });
    return transcript;
  }

  /**
   * Very simple heuristic planner that maps the user's text to a task/category.
   * You can later replace this with an LLM-based classifier.
   */
  decideNextAction(userText: string): OrchestrationDecision {
    const lower = userText.toLowerCase();

    if (/(video|edit.*video|generate.*video)/.test(lower)) {
      return {
        kind: "tool",
        toolName: "runway",
        reason: "User mentioned video-related work; Runway is appropriate.",
      };
    }

    if (/(voice|audio|tts|narration)/.test(lower)) {
      return {
        kind: "tool",
        toolName: "elevenlabs",
        reason: "User mentioned voice/audio work; ElevenLabs fits.",
      };
    }

    if (/(slides|presentation|deck)/.test(lower)) {
      return {
        kind: "tool",
        toolName: "gamma",
        reason: "User wants slides/presentation; Gamma is targeted at that.",
      };
    }

    if (/(code|implement|refactor|bug|pull request)/.test(lower)) {
      return {
        kind: "pipeline",
        taskCategory: "coding",
        reason: "User is asking for coding-related work.",
      };
    }

    if (/(search|research|web|news)/.test(lower)) {
      return {
        kind: "tool",
        toolName: "perplexity",
        reason: "User wants web/research; Perplexity is tuned for that.",
      };
    }

    if (/(analy[sz]e|explain|summari[sz]e|why|how)/.test(lower)) {
      return {
        kind: "llm",
        providerName: "openai",
        reason: "User is asking for reasoning/explanation.",
      };
    }

    // Default: cheap generic LLM.
    return {
      kind: "llm",
      providerName: "openrouter",
      reason: "Fallback to a cheap, general LLM when no specialization is obvious.",
    };
  }

  /**
   * Helper that, given user text, both decides and prepares the LLM provider.
   * This does not execute models; workers or controllers should call the
   * returned provider or tool.
   */
  async prepareForUserText(userText: string, sessionId?: string) {
    let historyPrefix = "";
    let contextSnippet = "";

    if (sessionId) {
      const [history, context] = await Promise.all([
        this.conversation.getConversationHistory(sessionId),
        this.conversation.getContext(sessionId),
      ]);

      if (history.length > 0) {
        const turns = history
          .slice(-10)
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n");
        historyPrefix = `Conversation so far:\n${turns}\n\n`;
      }

      if (context) {
        contextSnippet = `Persistent context:\n${JSON.stringify(context).slice(
          0,
          800
        )}\n\n`;
      }
    }

    const enrichedText =
      historyPrefix || contextSnippet
        ? `${contextSnippet}${historyPrefix}User request:\n${userText}`
        : userText;

    const decision = this.decideNextAction(enrichedText);
    logger.info("Orchestration decision", decision);

    if (decision.kind === "pipeline") {
      const provider = this.router.getProviderForTask("coding");
      return { decision, provider, tool: null, enrichedText };
    }

    if (decision.kind === "llm") {
      const taskCategory =
        decision.providerName === "anthropic"
          ? "coding"
          : decision.providerName === "openai"
          ? "reasoning"
          : "cheap";
      const provider = this.router.getProviderForTask(taskCategory);
      return { decision, provider, tool: null, enrichedText };
    }

    const tool = this.tools.find((t) => t.name === decision.toolName) ?? null;
    return { decision, provider: null, tool, enrichedText };
  }

  // Kept for backwards compatibility; new code should use prepareForUserText.
  getProviderForUserText(userText: string) {
    const decision = this.decideNextAction(userText);
    logger.info("Orchestration decision", decision);

    if (decision.kind === "pipeline") {
      const provider = this.router.getProviderForTask("coding");
      return { decision, provider, tool: null };
    }

    if (decision.kind === "llm") {
      const taskCategory =
        decision.providerName === "anthropic"
          ? "coding"
          : decision.providerName === "openai"
          ? "reasoning"
          : "cheap";
      const provider = this.router.getProviderForTask(taskCategory);
      return { decision, provider, tool: null };
    }

    const tool = this.tools.find((t) => t.name === decision.toolName) ?? null;
    return { decision, provider: null, tool };
  }

  /**
   * Append a simple user/assistant turn to the conversation history.
   * This keeps context up to date across orchestration calls.
   */
  async appendConversationTurn(sessionId: string, userText: string, assistantText: string) {
    await this.conversation.appendMessage(sessionId, "user", userText);
    await this.conversation.appendMessage(sessionId, "assistant", assistantText);
  }
}

