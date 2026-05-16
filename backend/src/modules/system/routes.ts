import { Hono } from "hono";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";

export function createSystemRoutes(repositories: Repositories) {
  const app = new Hono();

  app.get("/legal-docs/:docType", async (c) => sendOk(c, await repositories.system.legalDoc(c.req.param("docType"))));
  app.get("/client-config", async (c) => sendOk(c, await repositories.system.clientConfig()));

  return app;
}
