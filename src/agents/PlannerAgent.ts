import { ModelRouter } from "../services/modelRouter";
import { PipelineDefinition, PipelineDefinitionStep, StepType } from "../models/pipeline";

/**
 * PlannerAgent turns a free-form user task into a simple, deterministic
 * pipeline definition. It "uses" an LLM via ModelRouter, but the actual
 * step generation logic is rule-based so results are predictable and easy
 * to reason about.
 */
export class PlannerAgent {
  private readonly router: ModelRouter;

  constructor(deps?: { router?: ModelRouter }) {
    this.router = deps?.router ?? new ModelRouter();
  }

  async plan(task: string): Promise<PipelineDefinition> {
    // Best-effort: send the task to a reasoning model so you can later
    // inspect how it interpreted the request if desired. For now, we do not
    // use the response to keep behavior deterministic.
    const provider = this.router.getProviderForTask("reasoning");
    const prompt = `You are a planning assistant. A user asked: "${task}". ` +
      `We will generate pipeline steps using fixed rules, but you may provide ` +
      `a short (one sentence) planning summary for logging.\n\nSummary:`;
    try {
      await provider.generate(prompt);
    } catch {
      // Ignore LLM failures; planning logic below is fully deterministic.
    }

    const steps = this.buildSteps(task);

    const pipelineName = this.buildName(task);
    const description = `Auto-generated pipeline for task: ${task}`;

    return {
      name: pipelineName,
      description,
      steps,
    };
  }

  private buildName(task: string): string {
    const trimmed = task.trim();
    if (!trimmed) {
      return "Auto-generated pipeline";
    }
    const withoutPunctuation = trimmed.replace(/[.!?]+$/, "");
    const maxLen = 60;
    return withoutPunctuation.length > maxLen
      ? `${withoutPunctuation.slice(0, maxLen)}…`
      : withoutPunctuation;
  }

  private buildSteps(task: string): PipelineDefinitionStep[] {
    const lower = task.toLowerCase();
    const steps: PipelineDefinitionStep[] = [];

    // 1. Always start with a planner step.
    steps.push(this.step("planner", "break task into subtasks"));

    // 2. For anything code-related, add a coder step.
    if (/(code|api|service|function|class|node\.js|typescript|backend|frontend)/.test(lower)) {
      steps.push(this.step("coder", "generate code"));
    }

    // 3. If the user mentions tests, add a test_generator step.
    if (/(test|tests|testing|spec|jest|vitest|unit test)/.test(lower)) {
      steps.push(this.step("test_generator", "generate tests"));
    }

    // 4. Always end with a validator step.
    steps.push(this.step("validator", "validate output"));

    return steps;
  }

  private step(type: StepType, task: string): PipelineDefinitionStep {
    const baseInstruction =
      type === "planner"
        ? "You break high-level tasks into smaller actionable subtasks.\n"
        : type === "coder"
        ? "You generate high-quality, idiomatic TypeScript/Node.js code.\n"
        : type === "validator"
        ? "You carefully validate outputs and report any problems.\n"
        : type === "test_generator"
        ? "You generate thorough, maintainable tests for the produced code.\n"
        : "";

    const promptTemplate =
      `${baseInstruction}` +
      `Task: ${task}\n\n` +
      `Original user input: {{input}}\n\n` +
      `Output:`;

    return {
      stepType: type,
      task,
      promptTemplate,
    };
  }
}

