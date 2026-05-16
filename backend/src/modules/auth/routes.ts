import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../../config/env";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";
import { channelSchema, maskTarget } from "../../shared/validation";
import { jsonValidator } from "../../shared/zod";
import { signJwt, verifyJwt } from "../../shared/jwt";

const codeSchema = z.object({
  channel: channelSchema,
  target: z.string().min(3),
  scene: z.enum(["login", "bind"]).default("login")
});

const loginSchema = z.object({
  channel: channelSchema,
  target: z.string().min(3),
  code: z.string().min(4),
  deviceId: z.string().min(1)
});

export function createAuthRoutes(repositories: Repositories, env: AppEnv) {
  const app = new Hono();

  app.post("/auth/code", jsonValidator(codeSchema), (c) => {
    const body = c.req.valid("json");
    return sendOk(c, {
      cooldownSeconds: 60,
      expiresInSeconds: 300,
      maskedTarget: maskTarget(body.target)
    });
  });

  app.post("/auth/login", jsonValidator(loginSchema), async (c) => {
    const body = c.req.valid("json");
    const login = await repositories.auth.login(body.target);
    const accessToken = signJwt({ sub: login.observer.id, type: "access", ttlSeconds: env.jwt.accessTtlSeconds, secret: env.jwt.accessSecret });
    const refreshToken = signJwt({ sub: login.observer.id, type: "refresh", ttlSeconds: env.jwt.refreshTtlSeconds, secret: env.jwt.refreshSecret });
    return sendOk(c, {
      accessToken,
      refreshToken,
      isNewUser: login.isNewUser,
      observer: login.observer,
      nextRoute: login.isNewUser ? "onboarding" : "collection"
    });
  });

  app.post("/auth/refresh", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { refreshToken?: string };
    const payload = body.refreshToken ? verifyJwt(body.refreshToken, { secret: env.jwt.refreshSecret, type: "refresh" }) : null;
    if (!payload) {
      return c.json({ code: "PRISM_UNAUTHORIZED", message: "invalid refresh token", requestId: `req_${Date.now()}` }, 401 as never);
    }
    return sendOk(c, {
      accessToken: signJwt({ sub: payload.sub, type: "access", ttlSeconds: env.jwt.accessTtlSeconds, secret: env.jwt.accessSecret }),
      refreshToken: signJwt({ sub: payload.sub, type: "refresh", ttlSeconds: env.jwt.refreshTtlSeconds, secret: env.jwt.refreshSecret })
    });
  });
  app.post("/auth/signout", (c) => sendOk(c, { signedOut: true }));

  return app;
}
