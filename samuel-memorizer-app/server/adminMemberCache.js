export const ADMIN_DIRECTORY_KEY = "admin:directory";
export const ADMIN_META_KEY = "admin:meta";
/** KV 디렉터리 자동 재구성 주기 (7일) */
export const ADMIN_DIRECTORY_REBUILD_MS = 7 * 24 * 60 * 60 * 1000;

const ADMIN_LIST_FIELDS = [
  "userid",
  "name",
  "church",
  "avatar",
  "sex",
  "joinedAt",
  "updatedAt",
];

export function sortMembers(members) {
  return [...members].sort((a, b) => {
    const nameCmp = (a.name || a.userid || "").localeCompare(
      b.name || b.userid || "",
      "ko",
    );
    if (nameCmp !== 0) return nameCmp;
    return (a.userid || "").localeCompare(b.userid || "", "ko");
  });
}

export function resolveJoinedAt(profile) {
  return profile.joinedAt || profile.acceptedAt || profile.createdAt || null;
}

export function enrichMemberRecord(profile, existing = null) {
  const now = new Date().toISOString();
  const acceptedAt = profile.acceptedAt || existing?.acceptedAt || null;
  const createdAt = existing?.createdAt || profile.createdAt || now;

  return {
    ...profile,
    createdAt,
    acceptedAt,
    updatedAt: now,
    joinedAt: resolveJoinedAt({
      ...existing,
      ...profile,
      acceptedAt,
      createdAt,
    }),
  };
}

/** 관리자 목록용 — 연락처·주소 등 민감 필드 제외 */
export function toAdminListEntry(profile) {
  const entry = {};
  for (const key of ADMIN_LIST_FIELDS) {
    if (profile[key] != null && profile[key] !== "") {
      entry[key] = profile[key];
    }
  }
  entry.joinedAt = resolveJoinedAt(profile);
  return entry;
}

export function buildAdminDirectory(members) {
  const listEntries = sortMembers(members).map(toAdminListEntry);
  const updatedAt = new Date().toISOString();

  return {
    updatedAt,
    members: listEntries,
  };
}
