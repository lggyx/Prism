import { Hono } from "hono";
import { z } from "zod";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";
import { jsonValidator } from "../../shared/zod";

const createSliceSchema = z.object({
  readingId: z.string().min(1),
  isPublic: z.boolean().default(false)
});

const reanalyzeSchema = z.object({
  lensId: z.string().min(1)
});

const exportSchema = z.object({
  format: z.string().default("image/png"),
  includeLocation: z.boolean().default(false),
  template: z.string().default("instrument_card")
});

export function createSliceRoutes(repositories: Repositories) {
  const app = new Hono();

  app.post("/slices", jsonValidator(createSliceSchema), async (c) => {
    const body = c.req.valid("json");
    return sendOk(c, await repositories.slices.create(body));
  });

  app.get("/slices", async (c) =>
    sendOk(
      c,
      await repositories.slices.list({
        lensId: c.req.query("lensId") ?? "ALL",
        empty: c.req.query("empty") === "1"
      })
    )
  );

  app.get("/slices/:sliceId", async (c) => sendOk(c, await repositories.slices.findById(c.req.param("sliceId"))));

  app.delete("/slices/:sliceId", async (c) => sendOk(c, await repositories.slices.delete(c.req.param("sliceId"))));

  app.post("/slices/:sliceId/reanalyze", jsonValidator(reanalyzeSchema), async (c) => {
    const body = c.req.valid("json");
    return sendOk(c, await repositories.slices.reanalyze({ sliceId: c.req.param("sliceId"), lensId: body.lensId }));
  });

  app.post("/slices/:sliceId/export", jsonValidator(exportSchema), async (c) => {
    const body = c.req.valid("json");
    return sendOk(c, await repositories.slices.createExport({ sliceId: c.req.param("sliceId"), ...body }));
  });

  return app;
}
