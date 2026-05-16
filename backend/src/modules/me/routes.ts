import { Hono } from "hono";
import { z } from "zod";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";
import { jsonValidator } from "../../shared/zod";

const settingsSchema = z.object({
  showCommunityLocation: z.boolean().optional(),
  locationPrecision: z.enum(["CITY", "DISTRICT", "OFF"]).optional(),
  challengeNotifications: z.boolean().optional(),
  interfaceTheme: z.literal("DARK").optional(),
  defaultSlicePublic: z.boolean().optional()
});

export function createMeRoutes(repositories: Repositories) {
  const app = new Hono();

  app.get("/me", async (c) =>
    sendOk(c, {
      observer: await repositories.users.getMe(),
      stats: await repositories.users.getStats(),
      lensDistribution: await repositories.users.getLensDistribution(),
      activity: await repositories.users.getActivity(),
      settings: await repositories.users.getSettings(),
      app: { version: "0.1.0", versionLabel: "WORLDVIEW LENS v0.1.0 · MVP" }
    })
  );

  app.patch("/me/settings", jsonValidator(settingsSchema), async (c) => {
    const body = c.req.valid("json");
    return sendOk(c, await repositories.users.updateSettings(body));
  });

  return app;
}
