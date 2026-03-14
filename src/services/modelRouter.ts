import { AnthropicProvider } from "../agents/AnthropicProvider";
import { LLMProvider, TaskCategory } from "../agents/LLMProvider";
import { OpenAIProvider } from "../agents/OpenAIProvider";
import { OpenRouterProvider } from "../agents/OpenRouterProvider";

export class ModelRouter {
  private readonly openAI: OpenAIProvider;
  private readonly anthropic: AnthropicProvider;
  private readonly openRouter: OpenRouterProvider;

  constructor(deps?: {
    openAI?: OpenAIProvider;
    anthropic?: AnthropicProvider;
    openRouter?: OpenRouterProvider;
  }) {
    this.openAI = deps?.openAI ?? new OpenAIProvider();
    this.anthropic = deps?.anthropic ?? new AnthropicProvider();
    this.openRouter = deps?.openRouter ?? new OpenRouterProvider();
  }

  getProviderForTask(taskCategory: TaskCategory): LLMProvider {
    switch (taskCategory) {
      case "coding":
        return this.anthropic;
      case "reasoning":
        return this.openAI;
      case "cheap":
      default:
        return this.openRouter;
    }
  }
}

