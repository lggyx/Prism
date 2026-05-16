import { Hono } from "hono";
import { z } from "zod";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";
import { jsonValidator } from "../../shared/zod";

const createSessionSchema = z.object({
  entry: z.string().optional()
});

const messageSchema = z.object({
  text: z.string().min(1)
});

export function createLensCreatorRoutes(repositories: Repositories) {
  const app = new Hono();

  app.post("/lens-creator/sessions", jsonValidator(createSessionSchema), async (c) => {
    return sendOk(c, await repositories.lensCreator.createSession(c.req.valid("json")));
  });

  app.post("/lens-creator/sessions/:sessionId/audio", async (c) => {
    return sendOk(c, await repositories.lensCreator.transcribeAudio(c.req.param("sessionId")));
  });

  app.post("/lens-creator/sessions/:sessionId/messages", jsonValidator(messageSchema), async (c) => {
    return sendOk(c, await repositories.lensCreator.sendMessage(c.req.param("sessionId"), c.req.valid("json")));
  });

  app.post("/lens-creator/sessions/:sessionId/confirm", async (c) => {
    return sendOk(c, await repositories.lensCreator.confirm(c.req.param("sessionId")));
  });

  return app;
}
