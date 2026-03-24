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
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2Bucket?: string;
  r2PublicUrl?: string;
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
  r2AccountId: process.env.R2_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2Bucket: process.env.R2_BUCKET,
  r2PublicUrl: process.env.R2_PUBLIC_URL,
};

