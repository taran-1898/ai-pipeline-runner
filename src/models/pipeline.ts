export type StepType =
  | "planner"
  | "coder"
  | "validator"
  | "test_generator"
  | "reviewer"
  | "fixer"
  | "generic"
  | "tool";

export interface PipelineDefinitionStep {
  stepType: StepType;
  task: string;
  promptTemplate: string;
  schema?: unknown;
  dependsOn?: string[];
  dependsOnStepId?: string;
}

export interface PipelineDefinition {
  name: string;
  description?: string;
  steps: PipelineDefinitionStep[];
}

