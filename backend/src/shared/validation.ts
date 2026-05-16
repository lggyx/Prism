import { z } from "zod";

export const channelSchema = z.enum(["email", "sms"]);

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional()
});

export function maskTarget(target: string) {
  if (target.includes("@")) return target.replace(/^(.).*(@.*)$/, "$1***$2");
  return `${target.slice(0, 3)}****${target.slice(-2)}`;
}
