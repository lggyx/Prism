const base = process.env.BASE_URL ?? "http://localhost:3000/api/v1";
let accessToken = "";

async function request(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (accessToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${base}${path}`, { ...init, headers });
  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${JSON.stringify(json)}`);
  }

  const data = (json as { code?: number; data?: unknown } | null)?.data;
  if ((json as { code?: number } | null)?.code !== 0) {
    throw new Error(`${init?.method ?? "GET"} ${path} returned non-ok payload: ${JSON.stringify(json)}`);
  }
  return data;
}

async function main() {
  console.log(`Testing Prism API at ${base}`);

  const health = await request("/health");
  console.log("health", health);

  const code = await request("/auth/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel: "email", target: "alex@example.com", scene: "login" })
  });
  console.log("auth code", code);

  const login = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel: "email", target: "alex@example.com", code: "123456", deviceId: "dev_live" })
  });
  accessToken = (login as { accessToken: string }).accessToken;
  console.log("auth login", { hasAccessToken: Boolean(accessToken) });

  const lenses = await request("/lenses?category=ALL&scope=all");
  console.log("lenses", (lenses as { total: number }).total);

  const captureForm = new FormData();
  captureForm.append("image", new Blob(["prism-live-test"], { type: "image/jpeg" }), "live-test.jpg");
  captureForm.append("capturedAt", "2026-05-17T01:35:00+08:00");
  captureForm.append("latitude", "31.2304");
  captureForm.append("longitude", "121.4737");

  const capture = await request("/captures", {
    method: "POST",
    body: captureForm
  });
  console.log("capture", capture);

  const reading = await request("/readings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      captureId: (capture as { id: string }).id,
      lensId: "naturalist",
      language: "zh-CN"
    })
  });
  console.log("reading queued", reading);

  const readingId = (reading as { id: string }).id;
  const readingProcessing = await request(`/readings/${readingId}`);
  console.log("reading poll 1", readingProcessing);

  const readingSucceeded = await request(`/readings/${readingId}`);
  console.log("reading poll 2", readingSucceeded);

  const slice = await request("/slices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ readingId, isPublic: true })
  });
  console.log("slice saved", slice);

  const slices = await request("/slices?lensId=ALL&limit=20");
  console.log("slices total", (slices as { total: number }).total);

  const lensDetail = await request("/lenses/naturalist");
  console.log("lens detail", (lensDetail as { lens: { id: string } }).lens.id);

  const trending = await request("/lenses/trending?limit=4");
  console.log("trending", (trending as { items: unknown[] }).items.length);

  const retry = await request(`/readings/${readingId}/retry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lensId: "naturalist" })
  });
  console.log("reading retry", retry);

  const reanalyze = await request(`/slices/${(slice as { sliceId: string }).sliceId}/reanalyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lensId: "ruin-archaeology" })
  });
  console.log("slice reanalyze", reanalyze);

  const exportTask = await request(`/slices/${(slice as { sliceId: string }).sliceId}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format: "image/png", includeLocation: false, template: "instrument_card" })
  });
  console.log("export task", exportTask);

  const exported = await request(`/exports/${(exportTask as { exportTaskId: string }).exportTaskId}`);
  console.log("export detail", exported);

  const lensCreator = await request("/lens-creator/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry: "lens_picker" })
  });
  console.log("lens creator session", lensCreator);

  const sessionId = (lensCreator as { sessionId: string }).sessionId;
  const transcript = await request(`/lens-creator/sessions/${sessionId}/audio`, { method: "POST" });
  console.log("lens creator audio", transcript);

  const draft = await request(`/lens-creator/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "我想用一个考古学家的视角看城市。" })
  });
  console.log("lens creator draft", draft);

  const customLens = await request(`/lens-creator/sessions/${sessionId}/confirm`, { method: "POST" });
  console.log("lens creator confirm", customLens);

  const discover = await request("/discover");
  console.log("discover", (discover as { observerCount: number }).observerCount);

  const signals = await request("/signals");
  console.log("signals", (signals as { items: unknown[] }).items.length);

  const firstSignal = (signals as { items: Array<{ id: string }> }).items[0];
  if (firstSignal) {
    const signal = await request(`/signals/${firstSignal.id}`);
    console.log("signal detail", (signal as { id: string }).id);

    const resonance = await request(`/signals/${firstSignal.id}/resonance`, { method: "POST" });
    console.log("signal resonance", resonance);

    const noResonance = await request(`/signals/${firstSignal.id}/resonance`, { method: "DELETE" });
    console.log("signal no resonance", noResonance);
  }

  const me = await request("/me");
  console.log("me", me);

  const legal = await request("/legal-docs/privacy");
  console.log("legal", legal);

  const config = await request("/client-config");
  console.log("client config", config);

  const deleted = await request(`/slices/${(slice as { sliceId: string }).sliceId}`, { method: "DELETE" });
  console.log("slice deleted", deleted);

  console.log("Live API test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
