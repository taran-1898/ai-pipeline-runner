export type StepType = "planner" | "coder" | "validator" | "generic";

export interface PipelineDefinitionStep {
  stepType: StepType;
  task: string;
  promptTemplate: string;
}

export interface PipelineDefinition {
  name: string;
  description?: string;
  steps: PipelineDefinitionStep[];
}

