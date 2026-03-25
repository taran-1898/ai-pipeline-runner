## AI Pipeline Runner (MVP)

Backend service for executing multi-step AI pipelines across multiple LLM providers with execution tracing.

### Tech Stack

- **Runtime**: Node.js + TypeScript
- **Web Framework**: Fastify
- **Database**: PostgreSQL + Prisma
- **Queue**: Redis + BullMQ
- **LLMs**: OpenAI, Anthropic, OpenRouter (stubbed adapters)

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
PORT=3000
```

3. **Database migrations**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

4. **Seed example pipeline (optional)**

```bash
npx tsx src/example/seedExamplePipeline.ts
```

5. **Run the API server**

```bash
npm run dev
```

6. **Run the worker**

```bash
npm run worker
```

### Core API Endpoints

- **POST** `/pipelines` – create a pipeline (you can now attach per-step JSON Schemas and dependency information)
- **POST** `/pipelines/plan` – generate and persist a pipeline from a natural-language task
- **GET** `/pipelines` – list pipelines
- **POST** `/pipelines/:id/run` – start a pipeline run (enqueues a job into the DAG executor)
- **GET** `/runs/:id` – get run status and execution trace (with steps, including per-step status/timing/validation)

##This is something I am working on in my free time for my own amusement and eventually my own personal use. The end goal is to create a flow for product people to create PRDs/video samples/write code/Plan/use it as an Ideas board, all while using text or voice inputs at a single entrypoint. Trying to increase productivity on the go by introducing things like Tailscale into the mix. I am open to new ideas and inputs.
