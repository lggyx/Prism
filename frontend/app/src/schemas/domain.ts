import { z } from "zod";

export const observerSchema = z.object({
  id: z.string(),
  observerCode: z.string(),
  observerNo: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  isAnonymous: z.boolean(),
  activeSince: z.string(),
  activeSinceLabel: z.string()
});

export const lensSchema = z.object({
  id: z.string(),
  name: z.string(),
  englishName: z.string().optional(),
  category: z.string().optional(),
  color: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  fullDescription: z.string().optional(),
  prompt: z.string().optional(),
  usageCount: z.number().optional(),
  globalUsageCount: z.number().optional(),
  heat: z.number().optional(),
  isPreset: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional()
});

export const geoLocationSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  accuracyMeters: z.number().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  privateText: z.string().optional(),
  publicText: z.string().optional()
});

export const annotationSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  target: z.object({ x: z.number(), y: z.number() }),
  line: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  labelBox: z.object({ x: z.number(), y: z.number(), width: z.number() }).optional(),
  confidence: z.number().optional()
});

export const captureAssetSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  mimeType: z.string().optional(),
  capturedAt: z.string(),
  location: geoLocationSchema.optional()
});

export const readingSchema = z.object({
  id: z.string(),
  captureId: z.string().optional(),
  lensId: z.string().optional(),
  lens: lensSchema.optional(),
  imageUrl: z.string().optional(),
  status: z.enum(["queued", "processing", "succeeded", "failed", "timeout", "empty"]),
  progress: z.number().optional(),
  pollAfterMs: z.number().optional(),
  summary: z.string().optional(),
  annotations: z.array(annotationSchema).optional(),
  failureReason: z.string().optional(),
  emptyReason: z.string().optional(),
  userMessage: z.string().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().optional()
});

export const emptyStateSchema = z.object({
  type: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  actionText: z.string().optional(),
  actionRoute: z.string().optional()
});

export const sliceListItemSchema = z.object({
  id: z.string(),
  lens: lensSchema,
  thumbnailUrl: z.string().optional(),
  summary: z.string(),
  dateLabel: z.string().optional(),
  locationText: z.string().nullable().optional(),
  createdAt: z.string().optional()
});

export const sliceDetailSchema = z.object({
  id: z.string(),
  readingId: z.string(),
  captureId: z.string(),
  ownerObserverCode: z.string().optional(),
  lens: lensSchema,
  imageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  summary: z.string(),
  annotations: z.array(annotationSchema).default([]),
  location: geoLocationSchema.optional(),
  isPublic: z.boolean().optional(),
  resonanceCount: z.number().optional(),
  hasResonated: z.boolean().optional(),
  dateLabel: z.string().optional(),
  createdAt: z.string().optional(),
  savedAt: z.string().optional()
});

export const sliceListSchema = z.object({
  total: z.number(),
  filters: z.array(z.object({ lensId: z.string(), name: z.string(), color: z.string(), count: z.number() })).default([]),
  items: z.array(sliceListItemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  emptyState: emptyStateSchema.nullable()
});

export const meSchema = z.object({
  observer: observerSchema,
  stats: z.object({
    sliceCount: z.number(),
    usedLensCount: z.number(),
    locationCount: z.number(),
    resonanceReceived: z.number()
  }),
  lensDistribution: z.array(z.object({
    lensId: z.string(),
    name: z.string(),
    color: z.string(),
    count: z.number(),
    ratio: z.number()
  })).default([]),
  activity: z.union([
    z.object({
      range: z.string().optional(),
      items: z.array(z.object({
        date: z.string(),
        weekday: z.string(),
        sliceCount: z.number(),
        level: z.number(),
        detailText: z.string()
      })),
      levelRange: z.string().optional()
    }),
    z.array(z.object({
      date: z.string(),
      weekday: z.string(),
      sliceCount: z.number(),
      level: z.number(),
      detailText: z.string()
    }))
  ]),
  settings: z.object({
    showCommunityLocation: z.boolean(),
    locationPrecision: z.string(),
    challengeNotifications: z.boolean(),
    interfaceTheme: z.string(),
    defaultSlicePublic: z.boolean()
  }),
  app: z.object({ version: z.string(), versionLabel: z.string() })
});

export const clientConfigSchema = z.object({
  permissions: z.record(z.string(), z.object({
    title: z.string(),
    description: z.string()
  }))
});

export const discoverSchema = z.object({
  observerCount: z.number(),
  weeklyChallenge: z.object({
    id: z.string(),
    issueNo: z.string().optional(),
    title: z.string(),
    lensId: z.string().optional(),
    lensColor: z.string().optional(),
    joinedCount: z.number().optional(),
    hasJoined: z.boolean().optional(),
    daysLeft: z.number().optional()
  }).optional(),
  trendingLenses: z.array(lensSchema).default([]),
  signalFeed: z.object({
    items: z.array(z.object({
      id: z.string(),
      sliceId: z.string(),
      observerCode: z.string(),
      timeLabel: z.string().optional(),
      lens: lensSchema,
      thumbnailUrl: z.string().optional(),
      summary: z.string(),
      locationText: z.string().nullable().optional(),
      resonanceCount: z.number(),
      hasResonated: z.boolean().optional(),
      createdAt: z.string().optional()
    })),
    nextCursor: z.string().nullable().optional(),
    hasMore: z.boolean().optional()
  }),
  emptyState: emptyStateSchema.nullable().optional()
});

export type Observer = z.infer<typeof observerSchema>;
export type Lens = z.infer<typeof lensSchema>;
export type GeoLocation = z.infer<typeof geoLocationSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type CaptureAsset = z.infer<typeof captureAssetSchema>;
export type Reading = z.infer<typeof readingSchema>;
export type SliceListItem = z.infer<typeof sliceListItemSchema>;
export type SliceDetail = z.infer<typeof sliceDetailSchema>;
export type SliceList = z.infer<typeof sliceListSchema>;
export type Me = z.infer<typeof meSchema>;
export type ClientConfig = z.infer<typeof clientConfigSchema>;
export type Discover = z.infer<typeof discoverSchema>;
