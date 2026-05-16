import assert from "node:assert/strict";
import { createMockServer } from "./server.js";

const server = createMockServer();
const base = await new Promise((resolve) => {
  server.listen(0, "127.0.0.1", () => {
    const { port } = server.address();
    resolve(`http://127.0.0.1:${port}/api/v1`);
  });
});

async function request(method, path, body, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body instanceof FormData ? headers : { "Content-Type": "application/json", ...headers },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
  });
  const json = await response.json();
  assert.equal(response.ok, true, `${method} ${path} failed: ${JSON.stringify(json)}`);
  assert.equal(json.code, 0, `${method} ${path} returned non-ok code`);
  return json.data;
}

try {
  const code = await request("POST", "/auth/code", { channel: "email", target: "alex@example.com", scene: "login" });
  assert.equal(code.cooldownSeconds, 60);

  const login = await request("POST", "/auth/login", { channel: "email", target: "alex@example.com", code: "123456", deviceId: "dev_test" });
  assert.equal(login.nextRoute, "collection");

  const me = await request("GET", "/me");
  assert.equal(me.observer.observerCode, "OBS-0001");

  const settings = await request("PATCH", "/me/settings", { showCommunityLocation: false, locationPrecision: "OFF" });
  assert.equal(settings.locationPrecision, "OFF");

  const allLenses = await request("GET", "/lenses?category=ALL&scope=all&includeUsage=true");
  assert.equal(allLenses.total >= 6, true);

  const lens = await request("GET", "/lenses/naturalist");
  assert.equal(lens.lens.id, "naturalist");

  const trending = await request("GET", "/lenses/trending?limit=4");
  assert.equal(trending.items.length, 4);

  const form = new FormData();
  form.append("image", new Blob(["mock image"], { type: "image/jpeg" }), "mock.jpg");
  form.append("capturedAt", "2026-05-17T01:35:00+08:00");
  const capture = await request("POST", "/captures", form);
  assert.match(capture.id, /^cap_/);

  const queued = await request("POST", "/readings", { captureId: capture.id, lensId: "naturalist", language: "zh-CN" });
  assert.equal(queued.status, "queued");
  const processing = await request("GET", `/readings/${queued.id}`);
  assert.equal(processing.status, "processing");
  const succeeded = await request("GET", `/readings/${queued.id}`);
  assert.equal(succeeded.status, "succeeded");

  const failed = await request("POST", "/readings", { captureId: capture.id, lensId: "mock-failed" });
  const failedDetail = await request("GET", `/readings/${failed.id}`);
  assert.equal(failedDetail.status, "failed");

  const empty = await request("POST", "/readings", { captureId: capture.id, lensId: "mock-empty" });
  const emptyDetail = await request("GET", `/readings/${empty.id}`);
  assert.equal(emptyDetail.status, "empty");

  const retry = await request("POST", `/readings/${failed.id}/retry`, { lensId: "naturalist" });
  assert.equal(retry.status, "queued");

  const save = await request("POST", "/slices", { readingId: queued.id, isPublic: false });
  assert.match(save.sliceId, /^slice_/);
  const slices = await request("GET", "/slices?lensId=ALL&limit=20");
  assert.equal(slices.items.length > 0, true);
  const emptySlices = await request("GET", "/slices?empty=1");
  assert.equal(emptySlices.emptyState.type, "collection_empty");
  const slice = await request("GET", `/slices/${save.sliceId}`);
  assert.equal(slice.id, save.sliceId);

  const reanalyze = await request("POST", `/slices/${save.sliceId}/reanalyze`, { lensId: "ruin-archaeology" });
  assert.equal(reanalyze.nextRoute, "lens-result");

  const exportTask = await request("POST", `/slices/${save.sliceId}/export`, { format: "image/png", includeLocation: false, template: "instrument_card" });
  const exported = await request("GET", `/exports/${exportTask.exportTaskId}`);
  assert.equal(exported.status, "succeeded");

  const discover = await request("GET", "/discover");
  assert.equal(discover.weeklyChallenge.id, "challenge_07");
  assert.equal("imageUrl" in discover.signalFeed.items[0], false);
  assert.equal("imageUrl" in discover.signalFeed.items[1], false);

  const currentChallenge = await request("GET", "/challenges/current");
  assert.equal(currentChallenge.id, "challenge_07");

  const joined = await request("POST", "/challenges/challenge_07/join");
  assert.equal(joined.nextRoute, "capture");

  const signals = await request("GET", "/signals?sort=latest");
  assert.equal(signals.items.length > 0, true);
  assert.equal(signals.items[0].locationText, null);
  assert.equal("annotations" in signals.items[0], false);

  const signal = await request("GET", "/signals/signal_01");
  assert.equal(signal.id, "signal_01");

  const resonance = await request("POST", "/signals/signal_01/resonance");
  assert.equal(resonance.hasResonated, true);
  const noResonance = await request("DELETE", "/signals/signal_01/resonance");
  assert.equal(noResonance.hasResonated, false);

  const copied = await request("POST", "/signals/signal_01/save");
  assert.match(copied.sliceId, /^slice_copied_/);

  const report = await request("POST", "/signals/signal_01/report", { reason: "inappropriate", description: "optional text" });
  assert.equal(report.reported, true);

  const session = await request("POST", "/lens-creator/sessions", { entry: "lens_picker" });
  assert.match(session.sessionId, /^lc_/);

  const audio = new FormData();
  audio.append("audio", new Blob(["mock audio"], { type: "audio/webm" }), "mock.webm");
  const transcript = await request("POST", `/lens-creator/sessions/${session.sessionId}/audio`, audio);
  assert.equal(transcript.confidence > 0, true);

  const message = await request("POST", `/lens-creator/sessions/${session.sessionId}/messages`, { text: "我想用一个考古学家的视角看城市。" });
  assert.equal(message.status, "draft_ready");

  const confirmed = await request("POST", `/lens-creator/sessions/${session.sessionId}/confirm`);
  assert.equal(confirmed.lens.category, "CUSTOM");

  const legal = await request("GET", "/legal-docs/privacy");
  assert.equal(legal.docType, "privacy");

  const config = await request("GET", "/client-config");
  assert.equal(Boolean(config.permissions.camera), true);

  const signout = await request("POST", "/auth/signout");
  assert.equal(signout.signedOut, true);

  console.log("All mock API tests passed.");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
