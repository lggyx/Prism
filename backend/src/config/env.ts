export type AppEnv = {
  nodeEnv: string;
  port: number;
  host: string;
  apiPrefix: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
  };
  storage: {
    provider: "local";
    publicBaseUrl: string;
    rootDir: string;
  };
  ai: {
    provider: "mock" | "openai-compatible";
    apiKey?: string;
    baseUrl: string;
    model: string;
  };
};

export function loadEnv(): AppEnv {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? "0.0.0.0",
    apiPrefix: process.env.API_PREFIX ?? "/api/v1",
    database: {
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "prism",
      password: process.env.DB_PASSWORD ?? "prism_dev_password",
      name: process.env.DB_NAME ?? "prism"
    },
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret",
      accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 60 * 60 * 24 * 7),
      refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 30)
    },
    storage: {
      provider: "local",
      publicBaseUrl: process.env.PUBLIC_ASSET_BASE_URL ?? "/assets",
      rootDir: process.env.PUBLIC_ASSET_ROOT_DIR ?? "storage"
    },
    ai: {
      provider: process.env.AI_PROVIDER === "openai-compatible" ? "openai-compatible" : "mock",
      apiKey: process.env.AI_API_KEY,
      baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
      model: process.env.AI_MODEL ?? "gpt-4.1-mini"
    }
  };
}
