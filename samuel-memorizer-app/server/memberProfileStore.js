import { mapMemberProfileFromJbch, stripInternalCodes } from "../shared/memberProfileCore.js";

const KV_PREFIX = "member:";
const KV_INDEX = "member:index";
const CONSENT_PREFIX = "consent:";

function normalizeUserid(userid) {
  return String(userid ?? "").trim().toLowerCase();
}

function sortMembers(members) {
  return [...members].sort((a, b) => {
    const nameCmp = (a.name || a.userid || "").localeCompare(
      b.name || b.userid || "",
      "ko",
    );
    if (nameCmp !== 0) return nameCmp;
    return (a.userid || "").localeCompare(b.userid || "", "ko");
  });
}

function resolveJoinedAt(profile) {
  return (
    profile.joinedAt ||
    profile.acceptedAt ||
    profile.createdAt ||
    profile.updatedAt ||
    null
  );
}

function enrichMemberRecord(profile, existing = null) {
  const now = new Date().toISOString();
  const acceptedAt = profile.acceptedAt || existing?.acceptedAt || null;
  const createdAt = existing?.createdAt || profile.createdAt || now;

  return stripInternalCodes({
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
  });
}

function createNoopStore() {
  return {
    async upsert() {},
    async listAll() {
      return [];
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

/** jbch member_json result → KV 저장용 프로필 (mid/chid 제외) */
export function mapStoredMemberProfile(result) {
  return mapMemberProfileFromJbch(result);
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
    },

    async listAll() {
      const index = (await kv.get(KV_INDEX, "json")) ?? [];
      const ids = Array.isArray(index) ? index : [];
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
        const record = enrichMemberRecord({ ...existing, acceptedAt }, existing);
        await kv.put(`${KV_PREFIX}${id}`, JSON.stringify(record));
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
