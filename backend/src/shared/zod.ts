import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import { requestId } from "./response";

export function jsonValidator<T extends ZodSchema>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          code: "PRISM_VALIDATION_ERROR",
          message: result.error.issues[0]?.message ?? "validation failed",
          requestId: requestId()
        },
        400 as never
      );
    }
  });
}
