import { PipelineDefinition } from "../models/pipeline";

export const examplePipeline: PipelineDefinition = {
  name: "Code generation with validation",
  description: "Planner -> Coder -> Validator for code tasks",
  steps: [
    {
      stepType: "planner",
      task: "break task into subtasks",
      promptTemplate:
        "You are a planning assistant. Given the user input, break the task into clear subtasks.\n\nInput: {{input}}\n\nSubtasks (as JSON):",
    },
    {
      stepType: "coder",
      task: "generate code",
      promptTemplate:
        "You are a coding assistant. Given the planned subtasks and original input, generate TypeScript code.\n\nOriginal input: {{input}}\n\nCode:",
    },
    {
      stepType: "validator",
      task: "validate code output",
      promptTemplate:
        "You are a validation assistant. Given the generated code, validate that it is valid TypeScript and explain any issues.\n\nCode: {{input}}\n\nReturn a JSON object with fields isValid (boolean) and message (string).",
    },
  ],
};

