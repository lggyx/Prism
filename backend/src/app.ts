import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { Hono } from "hono";
import { createMemoryRepositories, type Repositories } from "./data/repositories";
import { loadEnv, type AppEnv } from "./config/env";
import { sendError } from "./shared/response";
import { createAuthRoutes } from "./modules/auth/routes";
import { createCaptureRoutes } from "./modules/captures/routes";
import { createHealthRoutes } from "./modules/health/routes";
import { createLensRoutes } from "./modules/lenses/routes";
import { createMeRoutes } from "./modules/me/routes";
import { createReadingRoutes } from "./modules/readings/routes";
import { createSliceRoutes } from "./modules/slices/routes";
import { createCommunityRoutes } from "./modules/community/routes";
import { createAuthContextMiddleware } from "./shared/auth-middleware";
import { createExportRoutes } from "./modules/exports/routes";
import { createLensCreatorRoutes } from "./modules/lens-creator/routes";
import { createSystemRoutes } from "./modules/system/routes";

export type AppOptions = {
  env?: AppEnv;
  repositories?: Repositories;
};

export function createApp(options: AppOptions = {}) {
  const env = options.env ?? loadEnv();
  const repositories = options.repositories ?? createMemoryRepositories();
  const app = new Hono();
  const api = new Hono();

  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Authorization", "X-Device-Id", "X-Client-Version", "Content-Type"]
    })
  );

  app.onError((error, c) => sendError(c, error));
  app.notFound((c) => c.json({ code: "PRISM_NOT_FOUND", message: "route not found", requestId: `req_${Date.now()}` }, 404 as never));
  app.use(
    "/assets/*",
    serveStatic({
      root: env.storage.rootDir,
      rewriteRequestPath: (path) => path.replace(/^\/assets\/?/, "")
    })
  );
  api.use("*", createAuthContextMiddleware(env));

  api.route("/", createHealthRoutes());
  api.route("/", createAuthRoutes(repositories, env));
  api.route("/", createMeRoutes(repositories));
  api.route("/", createLensRoutes(repositories));
  api.route("/", createCaptureRoutes(repositories));
  api.route("/", createReadingRoutes(repositories));
  api.route("/", createSliceRoutes(repositories));
  api.route("/", createCommunityRoutes(repositories));
  api.route("/", createExportRoutes(repositories));
  api.route("/", createLensCreatorRoutes(repositories));
  api.route("/", createSystemRoutes(repositories));

  app.route(env.apiPrefix, api);
  return app;
}
