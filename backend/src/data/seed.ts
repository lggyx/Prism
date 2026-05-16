import type { Annotation, CaptureAsset, GeoLocation, Lens, Observer, Settings, Slice } from "../shared/types";

export const observer: Observer = {
  id: "user_01",
  observerCode: "OBS-0001",
  observerNo: "01",
  email: "alex@example.com",
  isAnonymous: false,
  activeSince: "2026-05-10T00:00:00+08:00",
  activeSinceLabel: "ACTIVE SINCE 2026.05.10"
};

export const settings: Settings = {
  showCommunityLocation: true,
  locationPrecision: "CITY",
  challengeNotifications: true,
  interfaceTheme: "DARK",
  defaultSlicePublic: false
};

export const location: GeoLocation = {
  latitude: 31.2304,
  longitude: 121.4737,
  accuracyMeters: 18,
  city: "上海",
  province: "上海",
  privateText: "31.2304°N 121.4737°E",
  publicText: "上海 · 上海"
};

export const lenses: Lens[] = [
  lens("naturalist", "博物学家", "NATURALIST", "NATURE", "#5DCAA5", "ti-leaf", "生态标本与田野笔记", 5, 142),
  lens("urban-fatigue", "都市倦怠", "URBAN FATIGUE", "URBAN", "#B4B2A9", "ti-moon", "疲惫都市人的凝视", 3, 95),
  lens("song-literati", "宋代文人", "SONG LITERATI", "CULTURE", "#FAC775", "ti-brush", "清供雅趣与闲适心境", 2, 83),
  lens("ruin-archaeology", "废墟考古", "RUIN ARCHAEOLOGY", "TEMPORAL", "#F0997B", "ti-building", "当下之物的未来化石", 1, 156),
  lens("economist", "经济学家", "ECONOMIST", "URBAN", "#85B7EB", "ti-chart-bar", "一切都是资源、成本与博弈", 1, 78),
  lens("child-eye", "儿童视角", "CHILD'S EYE", "CULTURE", "#ED93B1", "ti-eye", "如果你只有五岁，这是什么", 0, 64)
];

export const annotations: Annotation[] = [
  annotation("anno_01", "悬铃木 / 落叶乔木，树龄约 25-30 年", 0.42, 0.22),
  annotation("anno_02", "路缘石磨损显示高频步行路径", 0.26, 0.68),
  annotation("anno_03", "窗格反光形成临时性的城市水面", 0.72, 0.31)
];

export const captures: CaptureAsset[] = [
  {
    id: "cap_01",
    imageUrl: "https://cdn.example.com/captures/cap_01.jpg",
    thumbnailUrl: "https://cdn.example.com/captures/cap_01_thumb.jpg",
    width: 3024,
    height: 4032,
    mimeType: "image/jpeg",
    capturedAt: "2026-05-17T01:35:00+08:00",
    location
  }
];

export const slices: Slice[] = [
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
  }
];

function lens(
  id: string,
  name: string,
  englishName: string,
  category: Lens["category"],
  color: string,
  icon: string,
  description: string,
  usageCount: number,
  globalUsageCount: number
): Lens {
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

function annotation(id: string, text: string, x: number, y: number): Annotation {
  return {
    id,
    text,
    target: { x, y },
    line: [
      { x, y },
      { x: Math.max(0.08, x - 0.1), y: Math.max(0.08, y - 0.05) }
    ],
    labelBox: { x: Math.max(0.05, x - 0.2), y: Math.max(0.05, y - 0.1), width: 0.32 },
    confidence: 0.86
  };
}

function shortLens(id: string): Slice["lens"] {
  const item = lenses.find((entry) => entry.id === id) ?? lenses[0];
  if (!item) throw new Error("missing seed lens");
  return {
    id: item.id,
    name: item.name,
    englishName: item.englishName,
    category: item.category,
    color: item.color,
    icon: item.icon
  };
}
