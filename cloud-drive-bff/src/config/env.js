const { z } = require('zod');

const schema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.string().default('development'),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  ACCESS_TOKEN_TTL_SECONDS: z.string().default('900'),
  REFRESH_TOKEN_TTL_SECONDS: z.string().default('604800'),

  COOKIE_SECURE: z.string().default('false'),
  COOKIE_SAMESITE: z.enum(['LAX', 'STRICT', 'NONE']).default('LAX'),
  COOKIE_DOMAIN: z.string().optional().default(''),
  REFRESH_COOKIE_NAME: z.string().default('refresh_token'),

  CORS_ORIGINS: z.string().default('*'),

  METADATA_BASE_URL: z.string().url(),
  FILE_BASE_URL: z.string().url(),

  INTERNAL_API_KEY: z.string().optional().default(''),
  INTERNAL_API_KEY_HEADER: z.string().default('x-internal-api-key'),

  DOWNSTREAM_TIMEOUT_MS: z.string().default('8000'),
});

function loadEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${msg}`);
  }
  const e = parsed.data;
  return {
    port: Number(e.PORT),
    env: e.NODE_ENV,
    databaseUrl: e.DATABASE_URL,

    jwtAccessSecret: e.JWT_ACCESS_SECRET,
    jwtRefreshSecret: e.JWT_REFRESH_SECRET,
    accessTtlSec: Number(e.ACCESS_TOKEN_TTL_SECONDS),
    refreshTtlSec: Number(e.REFRESH_TOKEN_TTL_SECONDS),

    cookieSecure: e.COOKIE_SECURE === 'true',
    cookieSameSite: e.COOKIE_SAMESITE,
    cookieDomain: e.COOKIE_DOMAIN || undefined,
    refreshCookieName: e.REFRESH_COOKIE_NAME,

    corsOrigins: e.CORS_ORIGINS === '*' ? ['*'] : e.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),

    metadataBaseUrl: e.METADATA_BASE_URL.replace(/\/$/, ''),
    fileBaseUrl: e.FILE_BASE_URL.replace(/\/$/, ''),

    internalApiKey: e.INTERNAL_API_KEY || '',
    internalApiKeyHeader: e.INTERNAL_API_KEY_HEADER,

    downstreamTimeoutMs: Number(e.DOWNSTREAM_TIMEOUT_MS),
  };
}

module.exports = { loadEnv };
