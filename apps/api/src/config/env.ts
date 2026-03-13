import "dotenv/config";

import { z } from "zod";

const booleanLikeSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off", ""].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:4000"),
  TIMEZONE: z.string().default("Asia/Seoul"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  LOCAL_DEMO_MODE: booleanLikeSchema.default(false),
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    ),
  ADMIN_BEARER_TOKEN: z.string().default("local-dev-admin-token"),
  CRON_SECRET: z.string().min(16).default("development-cron-secret"),
  SUPABASE_URL: z.string().trim().url().optional(),
  SUPABASE_ANON_KEY: z.string().trim().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().optional(),
  ANTHROPIC_API_KEY: z.string().trim().optional(),
  OPENAI_API_KEY: z.string().trim().optional(),
  GEMINI_API_KEY: z.string().trim().optional(),
  THREADS_APP_ID: z.string().trim().optional(),
  THREADS_APP_SECRET: z.string().trim().optional(),
  THREADS_ACCESS_TOKEN: z.string().trim().optional(),
  THREADS_USER_ID: z.string().trim().optional(),
  THREADS_REDIRECT_URI: z.string().trim().url().optional(),
  TELEGRAM_BOT_TOKEN: z.string().trim().optional(),
  TELEGRAM_CHAT_ID: z.string().trim().optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration", parsedEnv.error.flatten());
  throw new Error("Invalid environment configuration");
}

export const env = parsedEnv.data;
