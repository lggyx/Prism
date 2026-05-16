import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../config/env";
import { verifyJwt } from "./jwt";
import { runWithRequestContext } from "./request-context";
import { PrismError } from "./response";

const publicPathPrefixes = ["/health", "/auth", "/legal-docs", "/client-config", "/assets"];

export function createAuthContextMiddleware(env: AppEnv): MiddlewareHandler {
  return async (c, next) => {
    const path = new URL(c.req.url).pathname.replace(env.apiPrefix, "") || "/";
    const auth = c.req.header("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
    const payload = token ? verifyJwt(token, { secret: env.jwt.accessSecret, type: "access" }) : null;

    if (payload?.sub) {
      return runWithRequestContext({ userId: payload.sub }, next);
    }

    if (env.nodeEnv !== "production") {
      return runWithRequestContext({ userId: "user_01" }, next);
    }

    if (path === "/" || publicPathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return next();
    }

    throw new PrismError("PRISM_UNAUTHORIZED", "missing or invalid access token", 401);
  };
}
