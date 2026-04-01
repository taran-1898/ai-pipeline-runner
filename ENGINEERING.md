## Engineering Overview

This document explains where key concepts live in the codebase so you can quickly review or extend the AI Pipeline Runner service.

### High-Level Architecture

- **API / Transport**: Fastify HTTP server (`src/index.ts`, `src/api`, `src/router`), equipped with `@fastify/multipart` to handle live mobile and browser uploads directly.
- **Application Services**: Orchestrate use cases and encapsulate business logic (`src/services`). Notably features intelligent heuristics.
- **Domain Models**: Pipeline, run definitions, schemas, and remote node types (`src/models`, Prisma schema).
- **Infrastructure**: DB/Prisma, Redis/BullMQ, Cloudflare R2 interface (`src/config`).
- **Distributed Computing Layer**: Remote Worker integrations, capability-based scheduling across dynamic cluster nodes (`src/workers`).
- **AI / Agent Extensions**: LLM clients, transcription SDKs, synthetic tooling interfaces (`src/agents`).

### Where Things Go

- **HTTP layer (`src/api`, `src/controllers`, `src/router`)**
  - `src/api/*.ts`: Route registration per resource (e.g. `pipelines.ts`, `voice.ts`, `nodes.ts`).
  - `src/controllers/*.ts`: (Where applicable) Map HTTP requests to service calls, handle validation (via Zod), and shape responses. High-velocity endpoints like `voice.ts` often integrate Fastify logic securely to quickly process multimedia streams.
  - `src/router/index.ts`: Aggregates route modules and attaches them to the Fastify instance.

- **Domain and data models (`src/models`, `prisma/schema.prisma`)**
  - `src/models/pipeline.ts`: In-memory representation of pipeline definition types used at the API boundary, with attributes like `requiredCapability` strings to enable heterogeneous computation.
  - `src/models/node.ts`: Internal structure depicting `WorkerNode` lifecycle components like capabilities, status, and heartbeats.
  - `prisma/schema.prisma`: Source of truth for Postgres persisted entities.

- **Application services (`src/services`)**
  - `pipelineService.ts` / `runService.ts`: Standard CRUD + Operational interfaces for pipelines.
  - `orchestrationService.ts`: "The Brain". Takes transcriptions or text, makes tactical decisions (`pipeline` vs `llm` vs `tool`), and securely spawns planners or interactions to fulfill the intent.
  - `nodeRegistryService.ts`: Live singleton maps that keep tabs on connected remote nodes checking in via Tailscale, effectively evicting stale ones.
  - `storageService.ts`: Clean abstraction linking to Cloudflare R2 bucket interfaces.

- **LLM adapters, speech, and tools (`src/agents`)**
  - `LLMProvider.ts`: Interface (`generate(prompt: string): Promise<string>`) that all text LLM providers implement.
  - `SpeechToTextProvider.ts` + `WhisperProvider.ts`:
    - Provide deep integration with OpenAI implementations dynamically. 
    - Exposes abstractions (`transcribeBuffer(buffer: Buffer, mime: string)`) to cleanly upload HTTP form audio payload to OpenAI servers entirely in memory.
  - `AITool.ts` + `ExternalTools.ts`:
    - Clean abstractions binding the orchestrator to robust APIs like **Gemini** and **Perplexity**.
    - **ElevenLabs Tool**: Streams text-to-speech dynamically into Cloudflare R2 buffers to yield high-fidelity public playback links.
    - **Cursor Tool**: Bypasses traditional REST boundaries by actively mapping voice commands mathematically (via local LLMs) to provision sandboxed IDE spaces locally on your remote Tailscale worker, injecting precise `.cursor_instructions.md` context layers.

- **Queues, Orchestration, and Workers (`src/config/queue.ts`, `src/queue`, `src/workers`)**
  - `src/queue/pipelineExecutor.ts`:
    - The tactical DAG engine. Resolves dependency trees for `Run` tasks. 
    - Has integrated capability checking: If `stepType` requires `gpu`, logic branches to isolate jobs to localized `pipeline:node:<id>` queues managed through `BullMQ`. Uses dynamic polling logic (`waitUntilFinished`) to synchronize tasks.
  - `src/workers/pipelineWorker.ts`: Dedicated core backend listener for general compute pipeline queue steps.
  - `src/workers/remoteNodeWorker.ts`: A client-side bootstrapper. Deployed directly on edge hardware (Laptop, Home PC). Handshakes the network, broadcasts capability flags (e.g. `gpu`, `video_render`), establishes heartbeats, and securely pulls localized pipeline queue jobs.

### Extension Guidelines

- **Scaling to new endpoints**
  - Adding mobile / visual capabilities: Map file streams into `StorageService` for R2 preservation, pass explicit URIs or Buffers directly into Provider SDKs securely inside route handlers, and link with `OrchestrationService` heuristics.

- **Extending Remote Nodes**
  - New properties (OS tracking, latency profiles, sub-queues) should expand the `WorkerNode` definitions locally inside `src/models/node.ts` and ensure payload synchronicity in `nodes.ts` registrations.
