import { z } from "zod";
import { useSessionStore } from "../stores/sessionStore";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://lggyx.syt.huickathon.cn:3000/api/v1";

type RequestOptions = RequestInit & {
  schema?: z.ZodType;
};

const envelopeSchema = z.object({
  code: z.union([z.literal(0), z.string()]),
  message: z.string(),
  data: z.unknown().optional(),
  requestId: z.string().optional()
});

export class PrismApiError extends Error {
  constructor(message: string, public code = "PRISM_CLIENT_ERROR", public status?: number) {
    super(message);
    this.name = "PrismApiError";
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { schema, headers, ...init } = options;
  const session = useSessionStore.getState();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "X-Device-Id": session.deviceId,
      "X-Client-Version": "0.1.0",
      ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...headers
    }
  }).catch(() => {
    throw new PrismApiError(`Backend service offline: ${apiBaseUrl}`, "PRISM_NETWORK_OFFLINE");
  });

  const raw = await response.json().catch(() => {
    throw new PrismApiError("Invalid JSON response", "PRISM_INVALID_RESPONSE", response.status);
  });
  const envelope = envelopeSchema.parse(raw);
  if (!response.ok || envelope.code !== 0) {
    throw new PrismApiError(envelope.message, String(envelope.code), response.status);
  }
  return schema ? (schema.parse(envelope.data) as T) : (envelope.data as T);
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}
