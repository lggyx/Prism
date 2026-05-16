import http from "node:http";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const API_PREFIX = "/api/v1";
const now = () => new Date().toISOString();
const ok = (data) => ({ code: 0, message: "ok", data });
const err = (code, message, status = 400) => ({ status, body: { code, message, requestId: `req_${Date.now()}` } });

const observer = {
  id: "user_01",
  observerCode: "OBS-0001",
  observerNo: "01",
  email: "alex@example.com",
  isAnonymous: false,
  activeSince: "2026-05-10T00:00:00+08:00",
  activeSinceLabel: "ACTIVE SINCE 2026.05.10"
};

const settings = {
  showCommunityLocation: true,
  locationPrecision: "CITY",
  challengeNotifications: true,
  interfaceTheme: "DARK",
  defaultSlicePublic: false
};

const lenses = [
  lens("naturalist", "博物学家", "NATURALIST", "NATURE", "#5DCAA5", "ti-leaf", "生态标本与田野笔记", 5, 142),
  lens("urban-fatigue", "都市倦怠", "URBAN FATIGUE", "URBAN", "#B4B2A9", "ti-moon", "疲惫都市人的凝视", 3, 95),
  lens("song-literati", "宋代文人", "SONG LITERATI", "CULTURE", "#FAC775", "ti-brush", "清供雅趣与闲适心境", 2, 83),
  lens("ruin-archaeology", "废墟考古", "RUIN ARCHAEOLOGY", "TEMPORAL", "#F0997B", "ti-building", "当下之物的未来化石", 1, 156),
  lens("economist", "经济学家", "ECONOMIST", "URBAN", "#85B7EB", "ti-chart-bar", "一切都是资源、成本与博弈", 1, 78),
  lens("child-eye", "儿童视角", "CHILD'S EYE", "CULTURE", "#ED93B1", "ti-eye", "如果你只有五岁，这是什么", 0, 64)
];

const location = {
  latitude: 31.2304,
  longitude: 121.4737,
  accuracyMeters: 18,
  city: "上海",
  province: "上海",
  privateText: "31.2304°N 121.4737°E",
  publicText: "上海 · 上海"
};

const captures = new Map([
  ["cap_01", {
    id: "cap_01",
    imageUrl: "https://cdn.example.com/captures/cap_01.jpg",
    thumbnailUrl: "https://cdn.example.com/captures/cap_01_thumb.jpg",
    width: 3024,
    height: 4032,
    mimeType: "image/jpeg",
    capturedAt: "2026-05-17T01:35:00+08:00",
    location
  }]
]);
const readings = new Map();
const exportsById = new Map();
const reports = [];
const creatorSessions = new Map();

const annotations = [
  anno("anno_01", "悬铃木 / 落叶乔木，树龄约 25-30 年", 0.42, 0.22),
  anno("anno_02", "路缘石磨损显示高频步行路径", 0.26, 0.68),
  anno("anno_03", "窗格反光形成临时性的城市水面", 0.72, 0.31)
];

let slices = [
  {
    id: "slice_01",
    readingId: "read_seed_01",
    captureId: "cap_01",
    ownerObserverCode: "OBS-0001",
    lens: shortLens("naturalist"),
    imageUrl: "https://cdn.example.com/captures/cap_01.jpg",
    thumbnailUrl: "https://cdn.example.com/slices/slice_01_thumb.jpg",
    summary: "街角的日常，也有被看见的价值。",
    annotations,
    location,
    isPublic: false,
    resonanceCount: 5,
    dateLabel: "05.16",
    createdAt: "2026-05-16T10:20:00+08:00",
    savedAt: "2026-05-16T10:21:00+08:00"
  },
  {
    id: "slice_02",
    readingId: "read_seed_02",
    captureId: "cap_01",
    ownerObserverCode: "OBS-0001",
    lens: shortLens("urban-fatigue"),
    imageUrl: "https://cdn.example.com/captures/cap_01.jpg",
    thumbnailUrl: "https://cdn.example.com/slices/slice_02_thumb.jpg",
    summary: "霓虹、玻璃和等待，把通勤折叠成一段灰色时间。",
    annotations: annotations.slice(0, 2),
    location,
    isPublic: true,
    resonanceCount: 18,
    dateLabel: "05.15",
    createdAt: "2026-05-15T21:10:00+08:00",
    savedAt: "2026-05-15T21:12:00+08:00"
  }
];

const signals = [
  signal("signal_01", "slice_public_01", "OBS-0042", "naturalist", "这棵银杏比这条路存在的时间更久。", "2h ago", 12),
  signal("signal_02", "slice_public_02", "OBS-0118", "ruin-archaeology", "裂开的墙皮像尚未编号的出土层。", "5h ago", 7)
];

function lens(id, name, englishName, category, color, icon, description, usageCount, globalUsageCount) {
  return {
    id,
    name,
    englishName,
    category,
    color,
    icon,
    description,
    fullDescription: `以${name}的眼睛重新注视日常。`,
    usageCount,
    globalUsageCount,
    isPreset: true,
    isAvailable: true
  };
}

function shortLens(id) {
  const item = lenses.find((l) => l.id === id) || lenses[0];
  return { id: item.id, name: item.name, englishName: item.englishName, color: item.color, icon: item.icon, category: item.category };
}

function anno(id, text, x, y) {
  return {
    id,
    text,
    target: { x, y },
    line: [{ x, y }, { x: Math.max(0.08, x - 0.1), y: Math.max(0.08, y - 0.05) }],
    labelBox: { x: Math.max(0.05, x - 0.2), y: Math.max(0.05, y - 0.1), width: 0.32 },
    confidence: 0.86
  };
}

function signal(id, sliceId, observerCode, lensId, summary, timeLabel, resonanceCount) {
  return {
    id,
    sliceId,
    observerCode,
    timeLabel,
    lens: shortLens(lensId),
    thumbnailUrl: `https://cdn.example.com/slices/${sliceId}_thumb.jpg`,
    imageUrl: `https://cdn.example.com/slices/${sliceId}.jpg`,
    summary,
    annotationsPreview: [
      { text: "TRACE", target: { x: 0.32, y: 0.24 } },
      { text: "READ", target: { x: 0.66, y: 0.58 } }
    ],
    annotations,
    locationText: settings.showCommunityLocation ? "上海 · 上海" : null,
    resonanceCount,
    hasResonated: false,
    createdAt: "2026-05-17T00:20:00+08:00"
  };
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,X-Device-Id,X-Client-Version,Content-Type"
  });
  res.end(JSON.stringify(body, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks);
      const contentType = req.headers["content-type"] || "";
      if (!raw.length) return resolve({});
      if (contentType.includes("application/json")) {
        try {
          resolve(JSON.parse(raw.toString("utf8")));
        } catch {
          reject(err("PRISM_VALIDATION_ERROR", "invalid json"));
        }
        return;
      }
      resolve({ _rawBytes: raw.length, _contentType: contentType });
    });
    req.on("error", reject);
  });
}

function route(method, pathname) {
  const path = pathname.startsWith(API_PREFIX) ? pathname.slice(API_PREFIX.length) || "/" : pathname;
  return { method, path, parts: path.split("/").filter(Boolean) };
}

function makeReading(captureId, lensId) {
  const id = `read_${String(readings.size + 1).padStart(2, "0")}`;
  const status = lensId === "mock-failed" ? "failed" : lensId === "mock-empty" ? "empty" : lensId === "mock-timeout" ? "timeout" : "queued";
  const reading = { id, captureId, lensId, status, createdAt: now(), polls: 0 };
  readings.set(id, reading);
  return reading;
}

function readingResponse(reading) {
  if (["failed", "timeout"].includes(reading.status)) {
    return {
      id: reading.id,
      status: reading.status,
      failureReason: reading.status === "timeout" ? "TIMEOUT" : "MODEL_ERROR",
      userMessage: reading.status === "timeout" ? "解析超时，请稍后重试" : "解析失败，请稍后重试"
    };
  }
  if (reading.status === "empty") {
    return { id: reading.id, status: "empty", emptyReason: "BLURRY", userMessage: "这片视野太模糊了，试试靠近一点？" };
  }
  reading.polls += 1;
  if (reading.polls === 1) {
    reading.status = "processing";
    return { id: reading.id, status: "processing", progress: 0.42, pollAfterMs: 800 };
  }
  reading.status = "succeeded";
  const capture = captures.get(reading.captureId) || captures.get("cap_01");
  return {
    id: reading.id,
    captureId: reading.captureId,
    imageUrl: capture.imageUrl,
    status: "succeeded",
    lens: shortLens(reading.lensId),
    summary: `${shortLens(reading.lensId).name}视角下，普通现场显露出另一层秩序。`,
    annotations,
    createdAt: reading.createdAt,
    completedAt: now()
  };
}

function sliceList(query) {
  if (query.get("empty") === "1") {
    return {
      total: 0,
      filters: [],
      items: [],
      nextCursor: null,
      hasMore: false,
      emptyState: { type: "collection_empty", title: "还没有认知切片", subtitle: "拍下第一张照片，开始收藏你的视角", actionText: "BEGIN OBSERVATION", actionRoute: "capture" }
    };
  }
  const lensId = query.get("lensId");
  const filtered = lensId && lensId !== "ALL" ? slices.filter((s) => s.lens.id === lensId) : slices;
  const filters = lenses.slice(0, 4).map((l) => ({ lensId: l.id, name: l.name, color: l.color, count: slices.filter((s) => s.lens.id === l.id).length }));
  if (!filtered.length) {
    return {
      total: 0,
      filters,
      items: [],
      nextCursor: null,
      hasMore: false,
      emptyState: { type: "filter_empty", title: "该镜片下暂无切片", actionText: "CAPTURE WITH THIS LENS", actionRoute: "capture" }
    };
  }
  return {
    total: filtered.length,
    filters,
    items: filtered.map((s) => ({
      id: s.id,
      lens: s.lens,
      thumbnailUrl: s.thumbnailUrl,
      summary: s.summary,
      dateLabel: s.dateLabel,
      locationText: s.location?.privateText,
      createdAt: s.createdAt
    })),
    nextCursor: null,
    hasMore: false,
    emptyState: null
  };
}

async function handle(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const { method, path, parts } = route(req.method, url.pathname);
  if (!url.pathname.startsWith(API_PREFIX)) return send(res, 404, err("PRISM_NOT_FOUND", "route not found", 404).body);

  try {
    const body = ["POST", "PATCH", "DELETE"].includes(method) ? await readBody(req) : {};
    const result = await dispatch(method, path, parts, url.searchParams, body);
    send(res, result.status || 200, result.body || result);
  } catch (error) {
    const payload = error?.body ? error : err("PRISM_VALIDATION_ERROR", error?.message || "request failed");
    send(res, payload.status || 400, payload.body);
  }
}

async function dispatch(method, path, parts, query, body) {
  if (method === "POST" && path === "/auth/code") return ok({ cooldownSeconds: 60, expiresInSeconds: 300, maskedTarget: maskTarget(body.target || "alex@example.com") });
  if (method === "POST" && path === "/auth/login") {
    const isNewUser = body.target?.includes("new");
    return ok({ accessToken: "jwt_access_mock", refreshToken: "jwt_refresh_mock", isNewUser, observer: { ...observer, email: body.target || observer.email }, nextRoute: isNewUser ? "onboarding" : "collection" });
  }
  if (method === "POST" && path === "/auth/refresh") return ok({ accessToken: "jwt_access_new_mock", refreshToken: "jwt_refresh_new_mock" });
  if (method === "POST" && path === "/auth/signout") return ok({ signedOut: true });

  if (method === "GET" && parts[0] === "legal-docs") return ok({ docType: parts[1], title: parts[1] === "terms" ? "用户协议" : "隐私政策", version: "2026.05.17", contentMarkdown: "## 世界观透镜\n\n这是 Mock 协议内容。" });
  if (method === "GET" && path === "/client-config") return ok({ permissions: { camera: { title: "需要相机权限", description: "用于拍摄你正在观察的现实现场。" }, location: { title: "需要位置权限", description: "用于为私人切片保留时空坐标，社区展示会自动模糊。" }, microphone: { title: "需要麦克风权限", description: "用于通过语音创建自定义镜片。" } } });

  if (method === "GET" && path === "/me") return ok(meData());
  if (method === "PATCH" && path === "/me/settings") {
    Object.assign(settings, body);
    return ok(settings);
  }

  if (method === "POST" && path === "/captures") {
    const id = `cap_${String(captures.size + 1).padStart(2, "0")}`;
    const capture = { ...captures.get("cap_01"), id, imageUrl: `https://cdn.example.com/captures/${id}.jpg`, thumbnailUrl: `https://cdn.example.com/captures/${id}_thumb.jpg`, capturedAt: body.capturedAt || now() };
    captures.set(id, capture);
    return ok(capture);
  }
  if (method === "POST" && path === "/readings") {
    const reading = makeReading(body.captureId || "cap_01", body.lensId || "naturalist");
    return ok({ id: reading.id, status: "queued", pollAfterMs: 800 });
  }
  if (method === "GET" && parts[0] === "readings" && parts[1]) {
    const reading = readings.get(parts[1]);
    if (!reading) throw err("PRISM_NOT_FOUND", "reading not found", 404);
    return ok(readingResponse(reading));
  }
  if (method === "POST" && parts[0] === "readings" && parts[2] === "retry") {
    const old = readings.get(parts[1]);
    if (!old) throw err("PRISM_NOT_FOUND", "reading not found", 404);
    const reading = makeReading(old.captureId, body.lensId || old.lensId);
    return ok({ id: reading.id, status: "queued", pollAfterMs: 800 });
  }

  if (method === "GET" && path === "/lenses") {
    const category = query.get("category") || "ALL";
    const scope = query.get("scope") || "all";
    let items = lenses;
    if (category !== "ALL") items = items.filter((l) => l.category === category);
    if (scope === "preset") items = items.filter((l) => l.isPreset);
    if (scope === "custom") items = items.filter((l) => !l.isPreset);
    return ok({ total: items.length, items });
  }
  if (method === "GET" && path === "/lenses/trending") return ok({ items: lenses.slice(0, Number(query.get("limit") || 4)).map((l) => ({ id: l.id, name: l.name, englishName: l.englishName, color: l.color, icon: l.icon, heat: l.globalUsageCount })) });
  if (method === "GET" && parts[0] === "lenses" && parts[1]) {
    const item = lenses.find((l) => l.id === parts[1]);
    if (!item) throw err("PRISM_NOT_FOUND", "lens not found", 404);
    return ok({ lens: item, stats: { usageCount: item.usageCount, firstUsedAt: "2026-05-10T09:00:00+08:00", lastUsedAt: "2026-05-17T01:40:00+08:00" }, sampleSlices: slices.slice(0, 2).map((s) => ({ id: s.id, thumbnailUrl: s.thumbnailUrl, summary: s.summary, locationText: s.location.privateText, createdAt: s.createdAt, annotationsPreview: s.annotations.slice(0, 2) })), emptyState: { visible: false, title: "NO READINGS YET", actionText: "CAPTURE WITH THIS LENS" } });
  }

  if (method === "POST" && path === "/lens-creator/sessions") {
    const sessionId = `lc_${String(creatorSessions.size + 1).padStart(2, "0")}`;
    creatorSessions.set(sessionId, { sessionId, status: "asking" });
    return ok({ sessionId, status: "asking", assistantMessage: "你想用什么样的视角看世界？" });
  }
  if (method === "POST" && parts[0] === "lens-creator" && parts[1] === "sessions" && parts[3] === "audio") return ok({ transcript: "我想用一个考古学家的视角看城市。", confidence: 0.91 });
  if (method === "POST" && parts[0] === "lens-creator" && parts[1] === "sessions" && parts[3] === "messages") return ok({ sessionId: parts[2], status: "draft_ready", assistantMessage: "我为你生成了一枚镜片草稿。", draftLens: { name: "城市考古者", englishName: "URBAN ARCHAEOLOGIST", category: "CUSTOM", color: "#F0997B", description: "把街道、招牌和裂缝看成未来遗址", prompt: "以城市考古的视角解读画面..." } });
  if (method === "POST" && parts[0] === "lens-creator" && parts[1] === "sessions" && parts[3] === "confirm") return ok({ lens: { id: "custom_urban_archaeologist", name: "城市考古者", englishName: "URBAN ARCHAEOLOGIST", category: "CUSTOM", color: "#F0997B", icon: "ti-building", description: "把街道、招牌和裂缝看成未来遗址", usageCount: 0, isPreset: false, isAvailable: true } });

  if (method === "POST" && path === "/slices") {
    const reading = readings.get(body.readingId);
    const capture = captures.get(reading?.captureId || "cap_01") || captures.get("cap_01");
    const id = `slice_${String(slices.length + 1).padStart(2, "0")}`;
    const newSlice = { id, readingId: body.readingId, captureId: capture.id, ownerObserverCode: observer.observerCode, lens: shortLens(reading?.lensId || "naturalist"), imageUrl: capture.imageUrl, thumbnailUrl: `https://cdn.example.com/slices/${id}_thumb.jpg`, summary: "新的观察已经保存为认知切片。", annotations, location, isPublic: Boolean(body.isPublic), resonanceCount: 0, dateLabel: "05.17", createdAt: now(), savedAt: now() };
    slices.unshift(newSlice);
    return ok({ sliceId: id, alreadySaved: false });
  }
  if (method === "GET" && path === "/slices") return ok(sliceList(query));
  if (method === "GET" && parts[0] === "slices" && parts[1]) {
    const item = slices.find((s) => s.id === parts[1]);
    if (!item) throw err("PRISM_NOT_FOUND", "slice not found", 404);
    return ok({ ...item, location: { privateText: item.location.privateText } });
  }
  if (method === "DELETE" && parts[0] === "slices" && parts[1]) {
    slices = slices.filter((s) => s.id !== parts[1]);
    return ok({ deleted: true });
  }
  if (method === "POST" && parts[0] === "slices" && parts[2] === "reanalyze") {
    const item = slices.find((s) => s.id === parts[1]);
    if (!item) throw err("PRISM_NOT_FOUND", "slice not found", 404);
    const reading = makeReading(item.captureId, body.lensId || item.lens.id);
    return ok({ captureId: item.captureId, id: reading.id, status: "queued", nextRoute: "lens-result" });
  }
  if (method === "POST" && parts[0] === "slices" && parts[2] === "export") {
    const exportTaskId = `export_${String(exportsById.size + 1).padStart(2, "0")}`;
    exportsById.set(exportTaskId, { id: exportTaskId, sliceId: parts[1], status: "processing", polls: 0 });
    return ok({ exportTaskId, status: "processing", pollAfterMs: 1000 });
  }
  if (method === "GET" && parts[0] === "exports" && parts[1]) {
    const task = exportsById.get(parts[1]);
    if (!task) throw err("PRISM_NOT_FOUND", "export task not found", 404);
    task.polls += 1;
    return ok({ id: task.id, status: "succeeded", exportUrl: `https://cdn.example.com/exports/${task.sliceId}.png`, expiresAt: "2026-05-18T01:35:00+08:00" });
  }

  if (method === "GET" && path === "/discover") return ok({ observerCount: 1247, weeklyChallenge: challenge(), trendingLenses: lenses.slice(0, 4).map((l) => ({ id: l.id, name: l.name, color: l.color, heat: l.globalUsageCount })), signalFeed: { items: signals.map((item) => publicSignal(item)), nextCursor: "cursor_abc", hasMore: true }, emptyState: null });
  if (method === "GET" && path === "/challenges/current") return ok({ ...challenge(), description: "把每天经过的地方想象成千年后的考古现场", endsAt: "2026-05-20T23:59:59+08:00", progress: 0.4 });
  if (method === "POST" && parts[0] === "challenges" && parts[2] === "join") return ok({ hasJoined: true, joinedCount: 39, suggestedLensId: "ruin-archaeology", nextRoute: "capture" });
  if (method === "GET" && path === "/signals") {
    if (query.get("empty") === "1") return ok({ items: [], nextCursor: null, hasMore: false, emptyState: { type: "signal_empty", title: "暂无信号", subtitle: "成为第一个观察者", actionText: "BEGIN OBSERVATION", actionRoute: "capture" } });
    return ok({ items: signals.map((item) => publicSignal(item)), nextCursor: "cur_next", hasMore: true, emptyState: null });
  }
  if (method === "GET" && parts[0] === "signals" && parts[1]) {
    const item = signals.find((s) => s.id === parts[1]);
    if (!item) throw err("PRISM_NOT_FOUND", "signal not found", 404);
    return ok(publicSignal(item, true));
  }
  if (method === "POST" && parts[0] === "signals" && parts[2] === "resonance") {
    const item = signals.find((s) => s.id === parts[1]);
    if (!item) throw err("PRISM_NOT_FOUND", "signal not found", 404);
    item.hasResonated = true;
    item.resonanceCount += 1;
    return ok({ hasResonated: true, resonanceCount: item.resonanceCount });
  }
  if (method === "DELETE" && parts[0] === "signals" && parts[2] === "resonance") {
    const item = signals.find((s) => s.id === parts[1]);
    if (!item) throw err("PRISM_NOT_FOUND", "signal not found", 404);
    item.hasResonated = false;
    item.resonanceCount = Math.max(0, item.resonanceCount - 1);
    return ok({ hasResonated: false, resonanceCount: item.resonanceCount });
  }
  if (method === "POST" && parts[0] === "signals" && parts[2] === "save") return ok({ sliceId: `slice_copied_${randomUUID().slice(0, 8)}`, alreadySaved: false });
  if (method === "POST" && parts[0] === "signals" && parts[2] === "report") {
    reports.push({ signalId: parts[1], ...body });
    return ok({ reported: true });
  }

  throw err("PRISM_NOT_FOUND", "route not found", 404);
}

function maskTarget(target) {
  if (target.includes("@")) return target.replace(/^(.).*(@.*)$/, "$1***$2");
  return `${target.slice(0, 3)}****${target.slice(-2)}`;
}

function meData() {
  return {
    observer,
    stats: { sliceCount: slices.length, usedLensCount: 4, locationCount: 6, resonanceReceived: 23 },
    lensDistribution: [
      { lensId: "naturalist", name: "博物学家", color: "#5DCAA5", count: 5, ratio: 1 },
      { lensId: "urban-fatigue", name: "都市倦怠", color: "#B4B2A9", count: 3, ratio: 0.6 }
    ],
    activity: ["2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15", "2026-05-16", "2026-05-17"].map((date, index) => {
      const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
      const count = [0, 2, 1, 0, 3, 1, 2][index];
      return { date, weekday: weekdays[index], sliceCount: count, level: Math.min(3, count), detailText: `${weekdays[index]} · ${count} ${count === 1 ? "slice" : "slices"}` };
    }),
    settings,
    app: { version: "0.1.0", versionLabel: "WORLDVIEW LENS v0.1.0 · MVP" }
  };
}

function challenge() {
  return { id: "challenge_07", issueNo: "#07", title: "用废墟考古的眼光看你的通勤路", lensId: "ruin-archaeology", lensColor: "#F0997B", joinedCount: 38, hasJoined: false, daysLeft: 3 };
}

function publicSignal(item, detail = false) {
  const base = {
    id: item.id,
    sliceId: item.sliceId,
    observerCode: item.observerCode,
    timeLabel: item.timeLabel,
    lens: item.lens,
    thumbnailUrl: item.thumbnailUrl,
    summary: item.summary,
    annotationsPreview: item.annotationsPreview,
    locationText: settings.showCommunityLocation ? item.locationText : null,
    resonanceCount: item.resonanceCount,
    hasResonated: item.hasResonated,
    createdAt: item.createdAt
  };
  return detail ? { ...base, imageUrl: item.imageUrl, annotations: item.annotations } : base;
}

export function createMockServer() {
  return http.createServer(handle);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  createMockServer().listen(PORT, HOST, () => {
    console.log(`Worldview Lens mock server listening at http://${HOST}:${PORT}${API_PREFIX}`);
  });
}
