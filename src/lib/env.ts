export type EnvVars = {
  AUTH_SECRET: string;
  APP_URL: string;
  AI_PROVIDER: string;
  AI_TIMEOUT_MS: number;
  AI_BULK_MODE: string;
  AI_MAX_BULK_LEADS_PER_RUN: number;
  AI_BULK_DELAY_MS: number;
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
  EMAIL_MODE: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM_NAME: string;
  SMTP_FROM_EMAIL: string;
  REAL_SEND_DAILY_LIMIT: number;
  REAL_SEND_BATCH_LIMIT: number;
  REAL_SEND_DELAY_MS: number;
};

let _env: EnvVars | null = null;

function parseBool(v: string | undefined, def: boolean): boolean {
  if (!v) return def;
  return v === "true" || v === "1";
}

function parseIntSafe(v: string | undefined, def: number): number {
  if (!v) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function getEnv(): EnvVars {
  if (_env) return _env;
  _env = {
    AUTH_SECRET: process.env.AUTH_SECRET || "",
    APP_URL: process.env.APP_URL || "http://localhost:3000",
    AI_PROVIDER: process.env.AI_PROVIDER || "groq",
    AI_TIMEOUT_MS: parseIntSafe(process.env.AI_TIMEOUT_MS, 20000),
    AI_BULK_MODE: process.env.AI_BULK_MODE || "combined",
    AI_MAX_BULK_LEADS_PER_RUN: parseIntSafe(process.env.AI_MAX_BULK_LEADS_PER_RUN, 25),
    AI_BULK_DELAY_MS: parseIntSafe(process.env.AI_BULK_DELAY_MS, 2500),
    GROQ_API_KEY: process.env.GROQ_API_KEY || "",
    GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    EMAIL_MODE: (process.env.EMAIL_MODE || "simulation").toLowerCase(),
    SMTP_HOST: process.env.SMTP_HOST || "",
    SMTP_PORT: parseIntSafe(process.env.SMTP_PORT, 587),
    SMTP_SECURE: parseBool(process.env.SMTP_SECURE, false),
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "",
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || "",
    REAL_SEND_DAILY_LIMIT: parseIntSafe(process.env.REAL_SEND_DAILY_LIMIT, 20),
    REAL_SEND_BATCH_LIMIT: parseIntSafe(process.env.REAL_SEND_BATCH_LIMIT, 10),
    REAL_SEND_DELAY_MS: parseIntSafe(process.env.REAL_SEND_DELAY_MS, 5000),
  };
  return _env;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}

export type EnvWarning = {
  type: "error" | "warning" | "info";
  message: string;
};

export function getEnvironmentWarnings(): EnvWarning[] {
  const env = getEnv();
  const warnings: EnvWarning[] = [];

  if (!env.AUTH_SECRET) {
    warnings.push({ type: "error", message: "AUTH_SECRET is not set. Use a strong random string in production." });
  }
  if (env.AUTH_SECRET === "dev-secret-change-in-production-min-32-chars!!") {
    warnings.push({ type: "warning", message: "AUTH_SECRET is using the default dev value. Set a unique secret for production." });
  }
  if (env.APP_URL.includes("localhost") && isProduction()) {
    warnings.push({ type: "error", message: "APP_URL is set to localhost in production. Set it to your public domain." });
  }
  if (env.EMAIL_MODE === "smtp" && env.APP_URL.includes("localhost")) {
    warnings.push({ type: "warning", message: "EMAIL_MODE=smtp with APP_URL=localhost — unsubscribe links will not work for public recipients." });
  }
  if (env.REAL_SEND_DAILY_LIMIT > 50) {
    warnings.push({ type: "warning", message: `REAL_SEND_DAILY_LIMIT is ${env.REAL_SEND_DAILY_LIMIT}. Keep it at 50 or below for safety.` });
  }
  if (env.AI_MAX_BULK_LEADS_PER_RUN > 50) {
    warnings.push({ type: "warning", message: `AI_MAX_BULK_LEADS_PER_RUN is ${env.AI_MAX_BULK_LEADS_PER_RUN}. Keep it at 50 or below to avoid rate limits.` });
  }
  if (env.EMAIL_MODE === "smtp" && !env.SMTP_HOST) {
    warnings.push({ type: "warning", message: "EMAIL_MODE=smtp but SMTP_HOST is not configured. Set SMTP_* variables in .env." });
  }
  if (env.EMAIL_MODE === "smtp" && !env.SMTP_FROM_EMAIL) {
    warnings.push({ type: "warning", message: "EMAIL_MODE=smtp but SMTP_FROM_EMAIL is not set." });
  }

  return warnings;
}

export type PublicEnvInfo = {
  environment: string;
  appUrl: string;
  aiProvider: string;
  groqConfigured: boolean;
  groqModel: string;
  emailMode: string;
  smtpConfigured: boolean;
  fromEmail: string;
  dailyLimit: number;
  batchLimit: number;
  bulkLeadLimit: number;
  bulkDelay: number;
  googleAuthConfigured: boolean;
  googleRedirectUri: string;
};

export function getPublicEnvInfo(): PublicEnvInfo {
  const env = getEnv();
  return {
    environment: isProduction() ? "production" : "development",
    appUrl: env.APP_URL,
    aiProvider: env.AI_PROVIDER,
    groqConfigured: !!env.GROQ_API_KEY,
    groqModel: env.GROQ_MODEL,
    emailMode: env.EMAIL_MODE,
    smtpConfigured: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM_EMAIL),
    fromEmail: env.SMTP_FROM_EMAIL || "—",
    dailyLimit: env.REAL_SEND_DAILY_LIMIT,
    batchLimit: env.REAL_SEND_BATCH_LIMIT,
    bulkLeadLimit: env.AI_MAX_BULK_LEADS_PER_RUN,
    bulkDelay: env.AI_BULK_DELAY_MS,
    googleAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback",
  };
}
