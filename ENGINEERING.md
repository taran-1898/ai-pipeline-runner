## Engineering Overview

This document explains where key concepts live in the codebase so you can quickly review or extend the system.

### High-Level Architecture

- **API / Transport**: Fastify HTTP server (`src/index.ts`, `src/api`, `src/router`).
- **Application Services**: Orchestrate use cases and encapsulate business logic (`src/services`).
- **Domain Models**: Pipeline and run definitions and types (`src/models`, Prisma schema).
- **Infrastructure**: DB/Prisma, Redis/BullMQ, HTTP LLM clients (`src/config`, `src/agents`, `src/queue`, `src/workers`).

The goal is a light "clean architecture" separation: controllers know about HTTP, services know about use cases, and infrastructure details (DB, queues, external APIs) are injected or referenced behind thin interfaces.

### Where Things Go

- **HTTP layer (`src/api`, `src/controllers`, `src/router`)**
  - `src/api/*.ts`: Route registration per resource (e.g. `pipelines.ts`, `runs.ts`).
  - `src/controllers/*.ts`: Map HTTP requests to service calls, handle validation (via Zod), and shape responses.
  - `src/router/index.ts`: Aggregates route modules and attaches them to the Fastify instance.
  - Add new endpoints by:
    1. Creating a controller that calls a service.
    2. Wiring it in a route file under `src/api`.
    3. Registering the route file in `src/router/index.ts`.

- **Domain and data models (`src/models`, `prisma/schema.prisma`)**
  - `src/models/pipeline.ts`: In-memory/domain representation of pipeline definitions used at the API boundary.
  - `prisma/schema.prisma`: Source of truth for persisted entities:
    - `Pipeline`, `PipelineStep`, `Run`, `RunStep`, and `RunStatus`.
  - When you change data shapes that must be persisted, update the Prisma schema and generate a migration.

- **Application services (`src/services`)**
  - `pipelineService.ts`: CRUD-style operations on pipelines (create/list/get with steps).
  - `runService.ts`: Start runs, enqueue jobs, and read run state with execution traces.
  - `modelRouter.ts`: Chooses the right LLM provider for a given task category.
  - Add new use cases here (e.g. cancel run, retry failed step) so controllers stay thin and declarative.

- **LLM adapters, speech, and tools (`src/agents`)**
  - `LLMProvider.ts`: Interface (`generate(prompt: string): Promise<string>`) that all text LLM providers implement.
  - `OpenAIProvider.ts`, `AnthropicProvider.ts`, `OpenRouterProvider.ts`:
    - Contain provider-specific HTTP calls, authentication headers, and minimal response parsing.
    - Each is responsible for turning a plain string `prompt` into the appropriate request payload and mapping the response back to a plain string.
  - `SpeechToTextProvider.ts` + `WhisperProvider.ts`:
    - Abstraction + implementation for converting user audio into text using Whisper (or a stub if no key is present).
  - `AITool.ts` + `ExternalTools.ts`:
    - Generic `AITool` interface and concrete stubs for Gemini, Banana, Flow, Runway, ElevenLabs, Perplexity, Fathom, Gamma, and Cursor.
    - These are used by the orchestration layer when the best "answer" is to call a specialized tool instead of an LLM.

-- **Queues and workers (`src/config/queue.ts`, `src/queue`, `src/workers`)**
  - `src/config/queue.ts`: Queue names, Redis connection, and job types (`PipelineRunJobData`, `OrchestrationJobData`).
  - `src/queue/pipelineExecutor.ts`:
    - Orchestrates a single run:
      - Fetches `Run` + `Pipeline` + `PipelineStep`s.
      - Builds prompts per step from templates.
      - Routes prompts through `ModelRouter` to the appropriate provider.
      - Persists `RunStep` records including prompt/response/model/duration.
      - Handles validator steps and marks runs as `FAILED` on validation errors.
  - `src/workers/pipelineWorker.ts`:
    - BullMQ worker that:
      - Marks runs as `RUNNING`.
      - Delegates to `PipelineExecutor`.
      - Marks runs as `FAILED` on errors and logs them.
  - `src/services/orchestrationService.ts`:
    - Stateless planner that:
      - Optionally transcribes audio via Whisper.
      - Uses simple heuristics on user text to decide between LLMs, pipelines, and external tools.
  - `src/workers/orchestrationWorker.ts`:
    - BullMQ worker that:
      - Consumes user text from the orchestration queue.
      - Uses `OrchestrationService` to pick the best capability.
      - Executes a single LLM/tool call and logs the result snippet.
  - Any long-running or asynchronous orchestrations should go into new executors/workers following this pattern.

- **Validation (`src/validation`)**
  - `validatorService.ts`: Central place for cross-step validation logic.
  - For richer validation (e.g. per-step JSON schemas), extend this service and pass configuration from `PipelineStep` or metadata.

- **Configuration and utilities (`src/config`, `src/utils`)**
  - `env.ts`: Environment configuration (DB URL, Redis URL, LLM API keys, port).
  - `db.ts`: Prisma client instance.
  - `queue.ts`: BullMQ queue + Redis connection.
  - `logger.ts`: Simple console-backed logger abstraction.
  - Future cross-cutting helpers (metrics, tracing, feature flags) should live in `src/utils` or new dedicated folders.

- **Examples and tooling (`src/example`)**
  - `examplePipeline.ts`: Example domain-level pipeline definition.
  - `seedExamplePipeline.ts`: Script to seed the example pipeline into the DB.
  - Use this folder to store other one-off scripts and reference pipelines that demonstrate patterns without cluttering core services.

### Extension Guidelines

- **Adding a new LLM provider**
  - Create a new class in `src/agents` implementing `LLMProvider`.
  - Implement authentication and response parsing inside the adapter.
  - Update `ModelRouter` to route new task categories to the new provider.

- **Adding a new pipeline step type**
  - Add the type to `StepType` in `src/models/pipeline.ts`.
  - Decide its default task category in `PipelineExecutor` (for routing).
  - If it has custom behavior (e.g. branching, aggregation), encapsulate that logic in `PipelineExecutor` or a dedicated helper so services/controllers remain unchanged.

- **Adding new API features**
  - Keep controllers thin and side-effect-free; put business rules into services.
  - Prefer passing primitives and DTOs into services rather than Fastify objects.
  - Use Zod schemas in controllers for input validation at the edges.

