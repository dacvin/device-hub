export const queryKeys = {
  devices: {
    all: ["devices"] as const,
    list: (filters: unknown) => ["devices", "list", filters] as const,
    byCode: (code: string) => ["devices", "by-code", code] as const,
    byId: (id: string) => ["devices", "by-id", id] as const,
    photos: (deviceId: string) => ["devices", deviceId, "photos"] as const,
    documents: (deviceId: string) => ["devices", deviceId, "documents"] as const,
  },
  overview: {
    summary: ["overview", "summary"] as const,
  },
  groups: {
    all: ["groups"] as const,
    withCounts: ["groups", "with-counts"] as const,
    byId: (id: string) => ["groups", "by-id", id] as const,
  },
  units: {
    all: ["units"] as const,
    withCounts: ["units", "with-counts"] as const,
    byId: (id: string) => ["units", "by-id", id] as const,
  },
  manufacturers: {
    all: ["manufacturers"] as const,
    withCounts: ["manufacturers", "with-counts"] as const,
    byId: (id: string) => ["manufacturers", "by-id", id] as const,
  },
  members: {
    all: ["members"] as const,
    byEmail: (email: string) => ["members", "by-email", email] as const,
    current: ["members", "current"] as const,
  },
  activity: {
    recent: (limit: number) => ["activity", "recent", limit] as const,
    forEntity: (entityType: string, entityId: string, limit: number) =>
      ["activity", "by-entity", entityType, entityId, limit] as const,
  },
} as const;
