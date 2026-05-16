export const queryKeys = {
  clientConfig: ["client-config"] as const,
  discover: ["discover"] as const,
  me: ["me"] as const,
  lenses: ["lenses"] as const,
  slices: ["slices"] as const,
  slice: (id: string) => ["slice", id] as const,
  reading: (id: string) => ["reading", id] as const
};
