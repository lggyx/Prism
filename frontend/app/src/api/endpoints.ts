import { z } from "zod";
import {
  captureAssetSchema,
  clientConfigSchema,
  discoverSchema,
  lensSchema,
  meSchema,
  readingSchema,
  sliceDetailSchema,
  sliceListSchema
} from "../schemas/domain";
import type { CaptureAsset, ClientConfig, Discover, Lens, Me, Reading, SliceDetail, SliceList } from "../schemas/domain";
import { apiRequest } from "./client";

const authCodeSchema = z.object({
  cooldownSeconds: z.number(),
  expiresInSeconds: z.number(),
  maskedTarget: z.string()
});

const loginSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  isNewUser: z.boolean(),
  observer: z.object({
    id: z.string(),
    observerCode: z.string(),
    observerNo: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    isAnonymous: z.boolean(),
    activeSince: z.string(),
    activeSinceLabel: z.string()
  }),
  nextRoute: z.string()
});

export type LoginResult = z.infer<typeof loginSchema>;

export function sendAuthCode(target: string, channel: "email" | "sms" = "email") {
  return apiRequest<z.infer<typeof authCodeSchema>>("/auth/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, target, scene: "login" }),
    schema: authCodeSchema
  });
}

export function login(target: string, code: string, deviceId: string, channel: "email" | "sms" = "email") {
  return apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, target, code, deviceId }),
    schema: loginSchema
  });
}

export function signout() {
  return apiRequest<{ signedOut: boolean }>("/auth/signout", {
    method: "POST",
    schema: z.object({ signedOut: z.boolean() })
  });
}

export function getMe() {
  return apiRequest<Me>("/me", { schema: meSchema });
}

export function getClientConfig() {
  return apiRequest<ClientConfig>("/client-config", { schema: clientConfigSchema });
}

export function getDiscover() {
  return apiRequest<Discover>("/discover", { schema: discoverSchema });
}

export function getLenses() {
  return apiRequest<{ total: number; items: Lens[] }>("/lenses?category=ALL&scope=all&includeUsage=true", {
    schema: z.object({ total: z.number(), items: z.array(lensSchema) })
  });
}

export function getSlices() {
  return apiRequest<SliceList>("/slices?lensId=ALL&limit=20", { schema: sliceListSchema });
}

export function getSlice(sliceId: string) {
  return apiRequest<SliceDetail>(`/slices/${sliceId}`, { schema: sliceDetailSchema });
}

export function createCapture(form: FormData) {
  return apiRequest<CaptureAsset>("/captures", {
    method: "POST",
    body: form,
    schema: captureAssetSchema
  });
}

export function createReading(captureId: string, lensId: string) {
  return apiRequest<Reading>("/readings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ captureId, lensId, language: "zh-CN" }),
    schema: readingSchema
  });
}

export function getReading(readingId: string) {
  return apiRequest<Reading>(`/readings/${readingId}`, { schema: readingSchema });
}

export function retryReading(readingId: string, lensId: string) {
  return apiRequest<Reading>(`/readings/${readingId}/retry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lensId }),
    schema: readingSchema
  });
}

export function saveSlice(readingId: string, isPublic = false) {
  return apiRequest<{ sliceId: string; alreadySaved: boolean }>("/slices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ readingId, isPublic }),
    schema: z.object({ sliceId: z.string(), alreadySaved: z.boolean().optional().default(false) })
  });
}
