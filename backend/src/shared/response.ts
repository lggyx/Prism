import type { Context } from "hono";

export type ApiErrorCode =
  | "PRISM_UNAUTHORIZED"
  | "PRISM_FORBIDDEN"
  | "PRISM_NOT_FOUND"
  | "PRISM_VALIDATION_ERROR"
  | "PRISM_CODE_TOO_FREQUENT"
  | "PRISM_CODE_INVALID"
  | "PRISM_IMAGE_TOO_LARGE"
  | "PRISM_UNSUPPORTED_IMAGE"
  | "PRISM_READING_FAILED"
  | "PRISM_READING_TIMEOUT"
  | "PRISM_DUPLICATE_SAVE"
  | "PRISM_RATE_LIMITED";

export class PrismError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

export function ok<T>(data: T) {
  return { code: 0, message: "ok", data };
}

export function sendOk<T>(c: Context, data: T, status = 200) {
  return c.json(ok(data), status as never);
}

export function requestId() {
  return `req_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function sendError(c: Context, error: unknown) {
  if (error instanceof PrismError) {
    return c.json({ code: error.code, message: error.message, requestId: requestId() }, error.status as never);
  }

  return c.json(
    {
      code: "PRISM_VALIDATION_ERROR",
      message: error instanceof Error ? error.message : "request failed",
      requestId: requestId()
    },
    400 as never
  );
}
