import { Hono } from "hono";
import type { Repositories } from "../../data/repositories";
import { sendOk } from "../../shared/response";

export function createCommunityRoutes(repositories: Repositories) {
  const app = new Hono();

  app.get("/discover", async (c) => sendOk(c, await repositories.community.discover()));
  app.get("/challenges/current", async (c) => sendOk(c, await repositories.community.currentChallenge()));
  app.post("/challenges/:challengeId/join", async (c) => sendOk(c, await repositories.community.joinChallenge(c.req.param("challengeId"))));

  app.get("/signals", async (c) =>
    sendOk(
      c,
      await repositories.community.listSignals({
        empty: c.req.query("empty") === "1",
        lensId: c.req.query("lensId") || undefined,
        challengeId: c.req.query("challengeId") || undefined
      })
    )
  );
  app.get("/signals/:signalId", async (c) => sendOk(c, await repositories.community.findSignal(c.req.param("signalId"))));
  app.post("/signals/:signalId/resonance", async (c) => sendOk(c, await repositories.community.resonate(c.req.param("signalId"))));
  app.delete("/signals/:signalId/resonance", async (c) => sendOk(c, await repositories.community.unresonate(c.req.param("signalId"))));
  app.post("/signals/:signalId/save", async (c) => sendOk(c, await repositories.community.saveSignal(c.req.param("signalId"))));
  app.post("/signals/:signalId/report", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    return sendOk(c, await repositories.community.reportSignal(c.req.param("signalId"), sanitizeReportBody(body)));
  });

  return app;
}

function sanitizeReportBody(body: unknown) {
  if (!body || typeof body !== "object") return {};
  const record = body as Record<string, unknown>;
  return {
    reason: typeof record.reason === "string" ? record.reason : undefined,
    description: typeof record.description === "string" ? record.description : undefined
  };
}
