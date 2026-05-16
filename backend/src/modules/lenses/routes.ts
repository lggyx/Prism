import { Hono } from "hono";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";

export function createLensRoutes(repositories: Repositories) {
  const app = new Hono();

  app.get("/lenses", async (c) => {
    const category = c.req.query("category") ?? "ALL";
    const scope = c.req.query("scope") ?? "all";
    return sendOk(c, await repositories.lenses.list({ category, scope }));
  });

  app.get("/lenses/trending", async (c) => sendOk(c, await repositories.lenses.trending(Number(c.req.query("limit") ?? 4))));

  app.get("/lenses/:lensId", async (c) => sendOk(c, await repositories.lenses.detail(c.req.param("lensId"))));

  return app;
}
