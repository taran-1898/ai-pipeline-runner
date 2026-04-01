## AI Pipeline Runner

Backend service for dynamically orchestrating multi-step AI pipelines across numerous internal features, remote nodes over Tailscale, LLMs, and Voice commands. 

This project aims to create a unified flow for product managers and developers to dictate inputs (via text or voice), which automatically decompose into actionable tasks: generating PRDs, crafting video samples, writing code, or generating architectural plans all from a single entry point.

### Tech Stack

- **Runtime**: Node.js + TypeScript
- **Web Framework**: Fastify
- **Database**: PostgreSQL + Prisma
- **Queue**: Redis + BullMQ
- **Nodes/Execution**: Distributed Workers (e.g., via Tailscale) + Web/API execution
- **LLMs & Tools**: OpenAI, Anthropic, Gemini, OpenRouter, ElevenLabs (TTS streaming), Perplexity (Deep Search), and deep Cursor IDE local workspace hydration logic.
- **Storage**: Cloudflare R2 for artifacts and persistent audio storage

### Setup

1. **Install dependencies**

```bash
npm install
```

2. **Environment variables**

Create a `.env` file:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_pipeline_runner"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
OPENROUTER_API_KEY="your-openrouter-key"
WHISPER_API_KEY="your-openai-key" # For audio transcribing
R2_ACCOUNT_ID="your-r2-account-id"
R2_BUCKET="your-r2-bucket"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
PORT=3000
```

3. **Database migrations**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

4. **Run the API server**

```bash
npm run dev
```

5. **Run the core pipeline worker**

```bash
npm run worker
```

6. **(Optional) Run Remote Nodes**

If you have a laptop, GPU desktop, or cloud VM connected via Tailscale that you want to lend to the pipeline cluster:
```bash
NODE_NAME="my-home-pc" NODE_CAPABILITIES="gpu,video_render" npx tsx src/workers/remoteNodeWorker.ts
```

### Core API Endpoints

**Orchestration & Interactions**
- **POST** `/interactions` – Accepts text or path to an audio file. Asynchronously plans and executes commands.
- **POST** `/voice` – Advanced voice entry point. Accepts `multipart/form-data` with an `audio` file payload (perfect for mobile web/Safari). Transcribes the voice request using OpenAI Whisper, conditionally generates a rigorous pipeline map, and dispatches the execution while saving the raw input to R2 storage securely.

**Pipelines & Operations**
- **POST** `/pipelines` – create a custom pipeline manually. Attach JSON schemas, dynamic capability requirements (e.g., `"gpu"`), and dependent execution traces.
- **POST** `/pipelines/plan` – auto-generate a pipeline trace securely from a prompt.
- **GET** `/pipelines` – list available pipeline artifacts.
- **POST** `/pipelines/:id/run` – starts a specific pipeline task locally or farms it to connected remote queue workers.
- **GET** `/runs/:id` – stream run status or view deep execution topologies and artifact bindings.

**Network / Fleet Operations**
- **POST** `/nodes/register` – Remote worker nodes hit this endpoint on boot to broadcast their hardware capabilities (GPU power, audio processing tech, Whisper runtime bindings, etc.).
- **POST** `/nodes/:id/heartbeat` – Allows a node to signal it is alive and receptive.
- **GET** `/nodes` – View the live node cluster footprint.
- **GET** `/nodes/status` – View online/offline status counts across the fleet.
