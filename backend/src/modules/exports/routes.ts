import { Hono } from "hono";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";

export function createExportRoutes(repositories: Repositories) {
  const app = new Hono();
  app.get("/exports/:exportTaskId", async (c) => sendOk(c, await repositories.exports.findById(c.req.param("exportTaskId"))));
  return app;
}
