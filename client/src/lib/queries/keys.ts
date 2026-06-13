export const queryKeys = {
  devices: {
    all: ["devices"] as const,
    list: (filters: unknown) => ["devices", "list", filters] as const,
    byCode: (code: string) => ["devices", "by-code", code] as const,
    byId: (id: string) => ["devices", "by-id", id] as const,
    photos: (deviceId: string) => ["devices", deviceId, "photos"] as const,
    documents: (deviceId: string) => ["devices", deviceId, "documents"] as const,
  },
  groups: {
    all: ["groups"] as const,
    withCounts: ["groups", "with-counts"] as const,
    byId: (id: string) => ["groups", "by-id", id] as const,
  },
  departments: {
    all: ["departments"] as const,
    withCounts: ["departments", "with-counts"] as const,
    byId: (id: string) => ["departments", "by-id", id] as const,
  },
  manufacturers: {
    all: ["manufacturers"] as const,
    withCounts: ["manufacturers", "with-counts"] as const,
    byId: (id: string) => ["manufacturers", "by-id", id] as const,
  },
  members: {
    all: ["members"] as const,
    list: (filters: unknown) => ["members", "list", filters] as const,
    byId: (id: string) => ["members", "by-id", id] as const,
    deviceCount: (departmentId: string | null) => ["members", "device-count", departmentId] as const,
  },
  orgSettings: ["org-settings"] as const,
  userPreference: (userId: string) => ["user-preference", userId] as const,
  activity: {
    recent: (limit: number) => ["activity", "recent", limit] as const,
    byActor: (actorId: string, limit: number) => ["activity", "by-actor", actorId, limit] as const,
    byEntity: (entityType: string, entityId: string, limit: number) =>
      ["activity", "by-entity", entityType, entityId, limit] as const,
  },
  storage: {
    photoUrls: (paths: string[]) => ["storage", "photo-urls", paths] as const,
    documentUrls: (paths: string[]) => ["storage", "document-urls", paths] as const,
  },
} as const;
