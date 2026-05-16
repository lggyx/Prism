import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app";

const app = createApp();
const base = "http://localhost/api/v1";

type ApiResponse<T> = {
  code: number;
  data: T;
};

async function request<T = any>(method: string, path: string, body?: unknown) {
  const response = await app.fetch(
    new Request(`${base}${path}`, {
      method,
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
    })
  );
  const json = (await response.json()) as ApiResponse<T>;
  expect(response.ok).toBe(true);
  expect(json.code).toBe(0);
  return json.data;
}

describe("P0 API loop", () => {
  test("login, capture, reading, save slice, and list slices", async () => {
    const code = await request("POST", "/auth/code", { channel: "email", target: "alex@example.com", scene: "login" });
    expect(code.cooldownSeconds).toBe(60);

    const login = await request("POST", "/auth/login", {
      channel: "email",
      target: "alex@example.com",
      code: "123456",
      deviceId: "dev_test"
    });
    expect(login.nextRoute).toBe("collection");

    const lenses = await request("GET", "/lenses?category=ALL&scope=all&includeUsage=true");
    expect(lenses.total).toBeGreaterThanOrEqual(6);

    const form = new FormData();
    form.append("image", new Blob(["mock"], { type: "image/jpeg" }), "mock.jpg");
    form.append("capturedAt", "2026-05-17T01:35:00+08:00");
    const capture = await request("POST", "/captures", form);
    expect(capture.id).toMatch(/^cap_/);

    const queued = await request("POST", "/readings", { captureId: capture.id, lensId: "naturalist", language: "zh-CN" });
    expect(queued.status).toBe("queued");

    const processing = await request("GET", `/readings/${queued.id}`);
    expect(processing.status).toBe("processing");

    const succeeded = await request("GET", `/readings/${queued.id}`);
    expect(succeeded.status).toBe("succeeded");

    const saved = await request("POST", "/slices", { readingId: queued.id, isPublic: false });
    expect(saved.sliceId).toMatch(/^slice_/);

    const slices = await request("GET", "/slices?lensId=ALL&limit=20");
    expect(slices.total).toBeGreaterThan(0);

    const detail = await request("GET", `/slices/${saved.sliceId}`);
    expect(detail.id).toBe(saved.sliceId);

    const me = await request("GET", "/me");
    expect(me.observer.observerCode).toBe("OBS-0001");
  });

  test("supports empty and failed reading states", async () => {
    const empty = await request("POST", "/readings", { captureId: "cap_01", lensId: "mock-empty" });
    const emptyDetail = await request("GET", `/readings/${empty.id}`);
    expect(emptyDetail.status).toBe("empty");

    const failed = await request("POST", "/readings", { captureId: "cap_01", lensId: "mock-failed" });
    const failedDetail = await request("GET", `/readings/${failed.id}`);
    expect(failedDetail.status).toBe("failed");

    const emptySlices = await request("GET", "/slices?empty=1");
    expect(emptySlices.emptyState.type).toBe("collection_empty");
  });
});
