import { annotations, captures as captureSeed, lenses as lensSeed, location, observer, settings as settingsSeed, slices as sliceSeed } from "./seed";
import { dateLabel, nowIso } from "../shared/date";
import { PrismError } from "../shared/response";
import type { CaptureAsset, Lens, Observer, Reading, Settings, Slice } from "../shared/types";

export type CaptureUpload = {
  name?: string;
  type?: string;
  size?: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type CaptureCreateInput = {
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  image?: CaptureUpload;
};

export type Repositories = {
  auth: AuthRepository;
  users: UserRepository;
  lenses: LensRepository;
  captures: CaptureRepository;
  readings: ReadingRepository;
  slices: SliceRepository;
  community: CommunityRepository;
  exports: ExportRepository;
  lensCreator: LensCreatorRepository;
  system: SystemRepository;
};

export type AuthRepository = {
  login(target: string): Promise<{ observer: Observer; isNewUser: boolean }>;
};

export type UserRepository = {
  getMe(): Promise<Observer>;
  getSettings(): Promise<Settings>;
  updateSettings(input: Partial<Settings>): Promise<Settings>;
  getStats(): Promise<{
    sliceCount: number;
    usedLensCount: number;
    locationCount: number;
    resonanceReceived: number;
  }>;
  getLensDistribution(): Promise<Array<{ lensId: string; name: string; color: string; count: number; ratio: number }>>;
  getActivity(): Promise<{
    range: "last_7_days";
    items: Array<{ date: string; weekday: string; sliceCount: number; level: number; detailText: string }>;
  }>;
};

export type LensRepository = {
  list(input: { category?: string; scope?: string }): Promise<{ total: number; items: Lens[] }>;
  findById(id: string): Promise<Lens>;
  detail(id: string): Promise<unknown>;
  trending(limit: number): Promise<{ items: Array<Pick<Lens, "id" | "name" | "englishName" | "color" | "icon"> & { heat: number }> }>;
};

export type CaptureRepository = {
  create(input: CaptureCreateInput): Promise<CaptureAsset>;
  findById(id: string): Promise<CaptureAsset>;
};

export type ReadingRepository = {
  create(input: { captureId: string; lensId: string }): Promise<Reading>;
  findById(id: string): Promise<Reading>;
  getDetail(id: string): Promise<unknown>;
  retry(input: { readingId: string; lensId?: string }): Promise<{ id: string; status: "queued"; pollAfterMs: number }>;
};

export type SliceRepository = {
  create(input: { readingId: string; isPublic: boolean }): Promise<{ sliceId: string; alreadySaved: boolean }>;
  list(input: { lensId?: string; empty?: boolean }): Promise<unknown>;
  findById(id: string): Promise<unknown>;
  delete(id: string): Promise<{ deleted: boolean }>;
  reanalyze(input: { sliceId: string; lensId: string }): Promise<{ captureId: string; id: string; status: "queued"; nextRoute: "lens-result" }>;
  createExport(input: { sliceId: string; format: string; includeLocation: boolean; template: string }): Promise<{ exportTaskId: string; status: "processing"; pollAfterMs: number }>;
};

export type CommunityRepository = {
  discover(): Promise<unknown>;
  currentChallenge(): Promise<unknown>;
  joinChallenge(challengeId: string): Promise<unknown>;
  listSignals(input: { empty?: boolean; lensId?: string; challengeId?: string }): Promise<unknown>;
  findSignal(signalId: string): Promise<unknown>;
  resonate(signalId: string): Promise<{ hasResonated: boolean; resonanceCount: number }>;
  unresonate(signalId: string): Promise<{ hasResonated: boolean; resonanceCount: number }>;
  saveSignal(signalId: string): Promise<{ sliceId: string; alreadySaved: boolean }>;
  reportSignal(signalId: string, input: { reason?: string; description?: string }): Promise<{ reported: boolean }>;
};

export type ExportRepository = {
  findById(id: string): Promise<unknown>;
};

export type LensCreatorRepository = {
  createSession(input: { entry?: string }): Promise<unknown>;
  transcribeAudio(sessionId: string): Promise<unknown>;
  sendMessage(sessionId: string, input: { text: string }): Promise<unknown>;
  confirm(sessionId: string): Promise<unknown>;
};

export type SystemRepository = {
  legalDoc(docType: string): Promise<unknown>;
  clientConfig(): Promise<unknown>;
};

export function createMemoryRepositories(): Repositories {
  const lenses = [...lensSeed];
  const captures = new Map(captureSeed.map((item) => [item.id, { ...item }]));
  const readings = new Map<string, Reading>();
  let slices = sliceSeed.map((item) => ({ ...item }));
  let settings = { ...settingsSeed };

  const findLens = (id: string) => {
    const item = lenses.find((lens) => lens.id === id);
    if (!item) throw new PrismError("PRISM_NOT_FOUND", "lens not found", 404);
    return item;
  };

  const shortLens = (id: string): Slice["lens"] => {
    const item = findLens(id);
    return {
      id: item.id,
      name: item.name,
      englishName: item.englishName,
      category: item.category,
      color: item.color,
      icon: item.icon
    };
  };

  const findCapture = (id: string) => {
    const item = captures.get(id);
    if (!item) throw new PrismError("PRISM_NOT_FOUND", "capture not found", 404);
    return item;
  };

  return {
    auth: {
      async login(target) {
        return {
          observer: { ...observer, email: target },
          isNewUser: target.includes("new")
        };
      }
    },
    users: {
      getMe: async () => ({ ...observer }),
      getSettings: async () => ({ ...settings }),
      async updateSettings(input) {
        settings = { ...settings, ...input, interfaceTheme: "DARK" };
        return { ...settings };
      },
      getStats: async () => ({
        sliceCount: slices.length,
        usedLensCount: new Set(slices.map((slice) => slice.lens.id)).size,
        locationCount: slices.filter((slice) => slice.location).length,
        resonanceReceived: slices.reduce((sum, slice) => sum + slice.resonanceCount, 0)
      }),
      getLensDistribution: async () => [
        { lensId: "naturalist", name: "博物学家", color: "#5DCAA5", count: 5, ratio: 1 },
        { lensId: "urban-fatigue", name: "都市倦怠", color: "#B4B2A9", count: 3, ratio: 0.6 }
      ],
      getActivity: async () => ({
        range: "last_7_days",
        items: ["2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15", "2026-05-16", "2026-05-17"].map((date, index) => {
          const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
          const count = [0, 2, 1, 0, 3, 1, 2][index] ?? 0;
          const weekday = weekdays[index] ?? "M";
          return { date, weekday, sliceCount: count, level: Math.min(3, count), detailText: `${weekday} · ${count} ${count === 1 ? "slice" : "slices"}` };
        })
      })
    },
    lenses: {
      async list(input) {
        let items = lenses;
        if (input.category && input.category !== "ALL") items = items.filter((lens) => lens.category === input.category);
        if (input.scope === "preset") items = items.filter((lens) => lens.isPreset);
        if (input.scope === "custom") items = items.filter((lens) => !lens.isPreset);
        return { total: items.length, items };
      },
      findById: async (id) => findLens(id),
      detail: async (id) => ({ lens: findLens(id), stats: { usageCount: 0 }, sampleSlices: [], emptyState: { visible: true, title: "NO READINGS YET", actionText: "CAPTURE WITH THIS LENS" } }),
      trending: async (limit) => ({ items: lenses.slice(0, limit).map((lens) => ({ id: lens.id, name: lens.name, englishName: lens.englishName, color: lens.color, icon: lens.icon, heat: lens.globalUsageCount ?? 0 })) })
    },
    captures: {
      async create(input) {
        const id = `cap_${String(captures.size + 1).padStart(2, "0")}`;
        const seedCapture = captureSeed[0];
        if (!seedCapture) throw new PrismError("PRISM_NOT_FOUND", "seed capture not found", 404);
        const capture: CaptureAsset = {
          ...seedCapture,
          id,
          imageUrl: `https://cdn.example.com/captures/${id}.jpg`,
          thumbnailUrl: `https://cdn.example.com/captures/${id}_thumb.jpg`,
          capturedAt: input.capturedAt ?? nowIso(),
          location: input.latitude !== undefined && input.longitude !== undefined ? { ...location, latitude: input.latitude, longitude: input.longitude } : location
        };
        captures.set(id, capture);
        return capture;
      },
      findById: async (id) => findCapture(id)
    },
    readings: {
      async create(input) {
        findCapture(input.captureId);
        if (!input.lensId.startsWith("mock-")) findLens(input.lensId);
        const id = `read_${String(readings.size + 1).padStart(2, "0")}`;
        const status = input.lensId === "mock-failed" ? "failed" : input.lensId === "mock-empty" ? "empty" : input.lensId === "mock-timeout" ? "timeout" : "queued";
        const reading: Reading = { id, captureId: input.captureId, lensId: input.lensId, status, createdAt: nowIso(), polls: 0 };
        readings.set(id, reading);
        return reading;
      },
      async findById(id) {
        const item = readings.get(id);
        if (!item) throw new PrismError("PRISM_NOT_FOUND", "reading not found", 404);
        return item;
      },
      async getDetail(id) {
        const reading = await this.findById(id);
        if (reading.status === "failed" || reading.status === "timeout") {
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
        reading.completedAt = nowIso();
        const capture = findCapture(reading.captureId);
        const lens = shortLens(reading.lensId);
        return {
          id: reading.id,
          captureId: reading.captureId,
          imageUrl: capture.imageUrl,
          status: "succeeded",
          lens,
          summary: `${lens.name}视角下，普通现场显露出另一层秩序。`,
          annotations,
          createdAt: reading.createdAt,
          completedAt: reading.completedAt
        };
      },
      async retry(input) {
        const old = await this.findById(input.readingId);
        const reading = await this.create({ captureId: old.captureId, lensId: input.lensId ?? old.lensId });
        return { id: reading.id, status: "queued", pollAfterMs: 800 };
      }
    },
    slices: {
      async create(input) {
        const reading = readings.get(input.readingId);
        if (!reading) throw new PrismError("PRISM_NOT_FOUND", "reading not found", 404);
        const capture = findCapture(reading.captureId);
        const id = `slice_${String(slices.length + 1).padStart(2, "0")}`;
        const slice: Slice = {
          id,
          readingId: input.readingId,
          captureId: capture.id,
          ownerObserverCode: observer.observerCode,
          lens: shortLens(reading.lensId),
          imageUrl: capture.imageUrl,
          thumbnailUrl: `https://cdn.example.com/slices/${id}_thumb.jpg`,
          summary: "新的观察已经保存为认知切片。",
          annotations,
          location: capture.location,
          isPublic: input.isPublic,
          resonanceCount: 0,
          dateLabel: dateLabel(),
          createdAt: nowIso(),
          savedAt: nowIso()
        };
        slices = [slice, ...slices];
        return { sliceId: id, alreadySaved: false };
      },
      async list(input) {
        if (input.empty) {
          return {
            total: 0,
            filters: [],
            items: [],
            nextCursor: null,
            hasMore: false,
            emptyState: {
              type: "collection_empty",
              title: "还没有认知切片",
              subtitle: "拍下第一张照片，开始收藏你的视角",
              actionText: "BEGIN OBSERVATION",
              actionRoute: "capture"
            }
          };
        }

        const filtered = input.lensId && input.lensId !== "ALL" ? slices.filter((slice) => slice.lens.id === input.lensId) : slices;
        const filters = lenses.slice(0, 4).map((lens) => ({
          lensId: lens.id,
          name: lens.name,
          color: lens.color,
          count: slices.filter((slice) => slice.lens.id === lens.id).length
        }));

        if (!filtered.length) {
          return {
            total: 0,
            filters,
            items: [],
            nextCursor: null,
            hasMore: false,
            emptyState: {
              type: "filter_empty",
              title: "该镜片下暂无切片",
              actionText: "CAPTURE WITH THIS LENS",
              actionRoute: "capture"
            }
          };
        }

        return {
          total: filtered.length,
          filters,
          items: filtered.map((slice) => ({
            id: slice.id,
            lens: slice.lens,
            thumbnailUrl: slice.thumbnailUrl,
            summary: slice.summary,
            dateLabel: slice.dateLabel,
            locationText: slice.location?.privateText,
            createdAt: slice.createdAt
          })),
          nextCursor: null,
          hasMore: false,
          emptyState: null
        };
      },
      async findById(id) {
        const item = slices.find((slice) => slice.id === id);
        if (!item) throw new PrismError("PRISM_NOT_FOUND", "slice not found", 404);
        return { ...item, location: item.location ? { privateText: item.location.privateText } : undefined };
      }
      ,
      async delete(id) {
        const before = slices.length;
        slices = slices.filter((slice) => slice.id !== id);
        return { deleted: slices.length < before };
      },
      async reanalyze(input) {
        const item = slices.find((slice) => slice.id === input.sliceId);
        if (!item) throw new PrismError("PRISM_NOT_FOUND", "slice not found", 404);
        const id = `read_${String(readings.size + 1).padStart(2, "0")}`;
        readings.set(id, { id, captureId: item.captureId, lensId: input.lensId, status: "queued", createdAt: nowIso(), polls: 0 });
        return { captureId: item.captureId, id, status: "queued", nextRoute: "lens-result" };
      },
      async createExport(input) {
        return { exportTaskId: `export_${input.sliceId}`, status: "processing", pollAfterMs: 1000 };
      }
    },
    community: {
      discover: async () => ({ observerCount: 1, weeklyChallenge: challenge(), trendingLenses: lenses.slice(0, 4).map((lens) => ({ id: lens.id, name: lens.name, color: lens.color, heat: lens.globalUsageCount ?? 0 })), signalFeed: { items: [], nextCursor: null, hasMore: false }, emptyState: null }),
      currentChallenge: async () => ({ ...challenge(), description: "把每天经过的地方想象成千年后的考古现场", endsAt: "2026-05-20T23:59:59+08:00", progress: 0.4 }),
      joinChallenge: async () => ({ hasJoined: true, joinedCount: 39, suggestedLensId: "ruin-archaeology", nextRoute: "capture" }),
      listSignals: async () => ({ items: [], nextCursor: null, hasMore: false, emptyState: { type: "signal_empty", title: "暂无信号", subtitle: "成为第一个观察者", actionText: "BEGIN OBSERVATION", actionRoute: "capture" } }),
      findSignal: async () => {
        throw new PrismError("PRISM_NOT_FOUND", "signal not found", 404);
      },
      resonate: async () => ({ hasResonated: true, resonanceCount: 1 }),
      unresonate: async () => ({ hasResonated: false, resonanceCount: 0 }),
      saveSignal: async () => ({ sliceId: "slice_copied_mock", alreadySaved: false }),
      reportSignal: async () => ({ reported: true })
    },
    exports: {
      findById: async (id) => ({ id, status: "succeeded", exportUrl: `https://cdn.example.com/exports/${id}.png`, expiresAt: "2026-05-18T01:35:00+08:00" })
    },
    lensCreator: {
      createSession: async () => ({ sessionId: "lc_01", status: "asking", assistantMessage: "你想用什么样的视角看世界？" }),
      transcribeAudio: async () => ({ transcript: "我想用一个考古学家的视角看城市。", confidence: 0.91 }),
      sendMessage: async (sessionId) => ({ sessionId, status: "draft_ready", assistantMessage: "我为你生成了一枚镜片草稿。", draftLens: { name: "城市考古者", englishName: "URBAN ARCHAEOLOGIST", category: "CUSTOM", color: "#F0997B", description: "把街道、招牌和裂缝看成未来遗址", prompt: "以城市考古的视角解读画面..." } }),
      confirm: async () => ({ lens: { id: "custom_urban_archaeologist", name: "城市考古者", englishName: "URBAN ARCHAEOLOGIST", category: "CUSTOM", color: "#F0997B", icon: "ti-building", description: "把街道、招牌和裂缝看成未来遗址", usageCount: 0, isPreset: false, isAvailable: true } })
    },
    system: {
      legalDoc: async (docType) => ({ docType, title: docType === "terms" ? "用户协议" : "隐私政策", version: "2026.05.17", contentMarkdown: "## 世界观透镜\n\n这是开发环境协议内容。" }),
      clientConfig: async () => ({ permissions: { camera: { title: "需要相机权限", description: "用于拍摄你正在观察的现实现场。" }, location: { title: "需要位置权限", description: "用于为私人切片保留时空坐标，社区展示会自动模糊。" }, microphone: { title: "需要麦克风权限", description: "用于通过语音创建自定义镜片。" } } })
    }
  };
}

function challenge() {
  return { id: "challenge_07", issueNo: "#07", title: "用废墟考古的眼光看你的通勤路", lensId: "ruin-archaeology", lensColor: "#F0997B", joinedCount: 38, hasJoined: false, daysLeft: 3 };
}
