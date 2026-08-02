import {
  ADMIN_DIRECTORY_KEY,
  ADMIN_DIRECTORY_REBUILD_MS,
  ADMIN_META_KEY,
  buildAdminDirectory,
  enrichMemberRecord,
  sortMembers,
  toAdminListEntry,
} from "./adminMemberCache.js";

function stringifyField(value) {
  if (value == null || value === "") return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value).trim();
}

/** jbch member_json result → 저장용 프로필 (프로필 사진 URL 포함) */
export function mapStoredMemberProfile(result) {
  if (!result || typeof result !== "object") return null;

  const userid = stringifyField(result.userid);
  if (!userid) return null;

  return {
    name: stringifyField(result.username),
    church: stringifyField(result.churchname),
    email: stringifyField(result.email),
    userid,
    mid: stringifyField(result.mid),
    chid: stringifyField(result.chid),
    sex: stringifyField(result.sex || result.sexori),
    avatar: stringifyField(result.avatar),
    birth: stringifyField(result.birth),
    reborn: stringifyField(result.reborn),
    address: stringifyField(result.address),
    tel: stringifyField(result.tel),
    hand: stringifyField(result.hand),
    service: stringifyField(result.service),
  };
}

const KV_PREFIX = "member:";
const KV_INDEX = "member:index";
const CONSENT_PREFIX = "consent:";

function normalizeUserid(userid) {
  return String(userid ?? "").trim().toLowerCase();
}

function createNoopStore() {
  return {
    async upsert() {},
    async listAll() {
      return [];
    },
    async listForAdmin() {
      return { members: [], cachedAt: null, lastFullRebuildAt: null };
    },
    async getMember() {
      return null;
    },
    async rebuildAdminDirectory() {
      return { members: [], cachedAt: null, lastFullRebuildAt: null };
    },
    async hasConsent() {
      return false;
    },
    async recordConsent() {},
    async getConsentAt() {
      return null;
    },
  };
}

async function readMemberRecords(kv, ids) {
  const members = (
    await Promise.all(
      ids.map(async (userid) => {
        const raw = await kv.get(`${KV_PREFIX}${userid}`);
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }),
    )
  ).filter(Boolean);

  return sortMembers(members);
}

async function writeAdminDirectory(kv, members) {
  const directory = buildAdminDirectory(members);
  const now = directory.updatedAt;

  await kv.put(ADMIN_DIRECTORY_KEY, JSON.stringify(directory));
  await kv.put(
    ADMIN_META_KEY,
    JSON.stringify({ lastFullRebuildAt: now, updatedAt: now }),
  );

  return {
    members: directory.members,
    cachedAt: now,
    lastFullRebuildAt: now,
  };
}

async function patchAdminDirectoryEntry(kv, profile) {
  const raw = await kv.get(ADMIN_DIRECTORY_KEY);
  let directory = null;

  if (raw) {
    try {
      directory = JSON.parse(raw);
    } catch {
      directory = null;
    }
  }

  if (!directory?.members) return;

  const entry = toAdminListEntry(profile);
  const nextMembers = [...directory.members];
  const index = nextMembers.findIndex(
    (item) => normalizeUserid(item.userid) === normalizeUserid(profile.userid),
  );

  if (index >= 0) {
    nextMembers[index] = entry;
  } else {
    nextMembers.push(entry);
  }

  const updatedAt = new Date().toISOString();
  await kv.put(
    ADMIN_DIRECTORY_KEY,
    JSON.stringify({
      updatedAt,
      members: sortMembers(nextMembers),
    }),
  );
}

export function createKvProfileStore(kv) {
  return {
    async upsert(profile) {
      const userid = normalizeUserid(profile.userid);
      if (!userid) return;

      const existingRaw = await kv.get(`${KV_PREFIX}${userid}`);
      let existing = null;
      if (existingRaw) {
        try {
          existing = JSON.parse(existingRaw);
        } catch {
          existing = null;
        }
      }

      const record = enrichMemberRecord(
        {
          ...profile,
          userid: profile.userid || userid,
        },
        existing,
      );

      await kv.put(`${KV_PREFIX}${userid}`, JSON.stringify(record));

      const index = (await kv.get(KV_INDEX, "json")) ?? [];
      const ids = new Set(Array.isArray(index) ? index : []);
      ids.add(userid);
      await kv.put(KV_INDEX, JSON.stringify([...ids]));

      await patchAdminDirectoryEntry(kv, record);
    },

    async listAll() {
      const index = (await kv.get(KV_INDEX, "json")) ?? [];
      const ids = Array.isArray(index) ? index : [];
      return readMemberRecords(kv, ids);
    },

    async listForAdmin() {
      const directoryRaw = await kv.get(ADMIN_DIRECTORY_KEY);
      const meta = (await kv.get(ADMIN_META_KEY, "json")) ?? {};

      if (directoryRaw) {
        try {
          const directory = JSON.parse(directoryRaw);
          if (Array.isArray(directory?.members)) {
            return {
              members: directory.members,
              cachedAt: directory.updatedAt ?? null,
              lastFullRebuildAt: meta.lastFullRebuildAt ?? directory.updatedAt ?? null,
            };
          }
        } catch {
          /* rebuild below */
        }
      }

      return this.rebuildAdminDirectory();
    },

    async getMember(userid) {
      const id = normalizeUserid(userid);
      if (!id) return null;

      const raw = await kv.get(`${KV_PREFIX}${id}`);
      if (!raw) return null;

      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },

    async rebuildAdminDirectory() {
      const members = await this.listAll();
      return writeAdminDirectory(kv, members);
    },

    async hasConsent(userid) {
      const id = normalizeUserid(userid);
      if (!id) return false;
      const raw = await kv.get(`${CONSENT_PREFIX}${id}`);
      return Boolean(raw);
    },

    async recordConsent(userid) {
      const id = normalizeUserid(userid);
      if (!id) return;

      const acceptedAt = new Date().toISOString();
      await kv.put(
        `${CONSENT_PREFIX}${id}`,
        JSON.stringify({ acceptedAt }),
      );

      const existingRaw = await kv.get(`${KV_PREFIX}${id}`);
      if (!existingRaw) return;

      try {
        const existing = JSON.parse(existingRaw);
        const record = enrichMemberRecord(existing, {
          ...existing,
          acceptedAt,
        });
        await kv.put(`${KV_PREFIX}${id}`, JSON.stringify(record));
        await patchAdminDirectoryEntry(kv, record);
      } catch {
        /* ignore */
      }
    },

    async getConsentAt(userid) {
      const id = normalizeUserid(userid);
      if (!id) return null;
      const raw = await kv.get(`${CONSENT_PREFIX}${id}`);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed?.acceptedAt ?? null;
      } catch {
        return null;
      }
    },
  };
}

export function getProfileStore(env) {
  if (env?.MEMBER_PROFILES?.put) {
    return createKvProfileStore(env.MEMBER_PROFILES);
  }
  return createNoopStore();
}

export async function upsertMemberFromJbchResult(jbchResult, profileStore) {
  const profile = mapStoredMemberProfile(jbchResult);
  if (!profile || !profileStore) return;
  await profileStore.upsert(profile);
}

export { ADMIN_DIRECTORY_REBUILD_MS };
