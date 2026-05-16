export type LensCategory = "NATURE" | "CULTURE" | "URBAN" | "TEMPORAL" | "CUSTOM";
export type ReadingStatus = "queued" | "processing" | "succeeded" | "failed" | "timeout" | "empty";
export type NextRoute = "onboarding" | "collection" | "capture" | "lens-picker" | "lens-result";

export type Observer = {
  id: string;
  observerCode: string;
  observerNo: string;
  email?: string;
  phone?: string;
  isAnonymous: boolean;
  activeSince: string;
  activeSinceLabel: string;
};

export type Settings = {
  showCommunityLocation: boolean;
  locationPrecision: "CITY" | "DISTRICT" | "OFF";
  challengeNotifications: boolean;
  interfaceTheme: "DARK";
  defaultSlicePublic: boolean;
};

export type Lens = {
  id: string;
  name: string;
  englishName: string;
  category: LensCategory;
  color: string;
  icon: string;
  description: string;
  fullDescription?: string;
  prompt?: string;
  usageCount: number;
  globalUsageCount?: number;
  isPreset: boolean;
  isAvailable: boolean;
  createdBy?: string;
  createdAt?: string;
};

export type GeoLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  city?: string;
  province?: string;
  privateText: string;
  publicText: string;
};

export type CaptureAsset = {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/heic";
  capturedAt: string;
  exif?: {
    iso?: number;
    shutter?: string;
    aperture?: string;
  };
  location?: GeoLocation;
};

export type Annotation = {
  id: string;
  text: string;
  target: { x: number; y: number };
  line?: Array<{ x: number; y: number }>;
  labelBox?: { x: number; y: number; width: number };
  confidence?: number;
};

export type Reading = {
  id: string;
  captureId: string;
  lensId: string;
  status: ReadingStatus;
  createdAt: string;
  completedAt?: string;
  polls: number;
};

export type Slice = {
  id: string;
  readingId: string;
  captureId: string;
  ownerObserverCode: string;
  lens: Pick<Lens, "id" | "name" | "englishName" | "category" | "color" | "icon">;
  imageUrl: string;
  thumbnailUrl: string;
  summary: string;
  annotations: Annotation[];
  location?: GeoLocation;
  isPublic: boolean;
  resonanceCount: number;
  hasResonated?: boolean;
  dateLabel: string;
  createdAt: string;
  savedAt: string;
};
