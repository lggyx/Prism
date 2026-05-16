import { Hono } from "hono";
import type { Repositories } from "../../data/repositories";
import { PrismError, sendOk } from "../../shared/response";

export function createCaptureRoutes(repositories: Repositories) {
  const app = new Hono();

  app.post("/captures", async (c) => {
    const contentType = c.req.header("content-type") ?? "";
    const body = contentType.includes("multipart/form-data") ? await c.req.parseBody() : await parseJsonBody(c.req);
    const image = getImageField(body);
    const capture = await repositories.captures.create({
      capturedAt: stringField(body.capturedAt),
      latitude: numberField(body.latitude),
      longitude: numberField(body.longitude),
      image
    });

    return sendOk(c, capture);
  });

  return app;
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberField(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.length > 0) return Number(value);
  return undefined;
}

async function parseJsonBody(req: { json: () => Promise<unknown> }) {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    throw new PrismError("PRISM_VALIDATION_ERROR", "Malformed JSON in request body", 400);
  }
}

function getImageField(body: Record<string, unknown>) {
  const image = body.image;
  if (image && typeof image === "object" && "arrayBuffer" in image && typeof (image as { arrayBuffer?: unknown }).arrayBuffer === "function") {
    return image as {
      name?: string;
      type?: string;
      size?: number;
      arrayBuffer(): Promise<ArrayBuffer>;
    };
  }
  return undefined;
}
