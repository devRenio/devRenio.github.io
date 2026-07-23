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
  };
}

export function createKvProfileStore(kv) {
  return {
    async upsert(profile) {
      const userid = normalizeUserid(profile.userid);
      if (!userid) return;
      const record = {
        ...profile,
        userid: profile.userid || userid,
        updatedAt: new Date().toISOString(),
      };
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
      await kv.put(
        `${CONSENT_PREFIX}${id}`,
        JSON.stringify({ acceptedAt: new Date().toISOString() }),
      );
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
