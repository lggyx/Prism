import { Hono } from "hono";
import { z } from "zod";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";
import { jsonValidator } from "../../shared/zod";

const createReadingSchema = z.object({
  captureId: z.string().min(1),
  lensId: z.string().min(1),
  language: z.string().default("zh-CN")
});

export function createReadingRoutes(repositories: Repositories) {
  const app = new Hono();

  app.post("/readings", jsonValidator(createReadingSchema), async (c) => {
    const body = c.req.valid("json");
    const reading = await repositories.readings.create({ captureId: body.captureId, lensId: body.lensId });
    return sendOk(c, { id: reading.id, status: "queued", pollAfterMs: 800 });
  });

  app.get("/readings/:readingId", async (c) => sendOk(c, await repositories.readings.getDetail(c.req.param("readingId"))));

  app.post("/readings/:readingId/retry", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const lensId = typeof body.lensId === "string" ? body.lensId : undefined;
    return sendOk(c, await repositories.readings.retry({ readingId: c.req.param("readingId"), lensId }));
  });

  return app;
}
