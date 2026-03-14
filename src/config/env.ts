import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  port: number;
  databaseUrl: string;
  redisUrl: string;
  openAiApiKey?: string;
  anthropicApiKey?: string;
  openRouterApiKey?: string;
  whisperApiKey?: string;
  geminiApiKey?: string;
  bananaApiKey?: string;
  flowApiKey?: string;
  runwayApiKey?: string;
  elevenLabsApiKey?: string;
  perplexityApiKey?: string;
  fathomApiKey?: string;
  gammaApiKey?: string;
  cursorApiKey?: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/ai_pipeline_runner",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  openAiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  whisperApiKey: process.env.WHISPER_API_KEY ?? process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  bananaApiKey: process.env.BANANA_API_KEY,
  flowApiKey: process.env.FLOW_API_KEY,
  runwayApiKey: process.env.RUNWAY_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  perplexityApiKey: process.env.PERPLEXITY_API_KEY,
  fathomApiKey: process.env.FATHOM_API_KEY,
  gammaApiKey: process.env.GAMMA_API_KEY,
  cursorApiKey: process.env.CURSOR_API_KEY,
};

