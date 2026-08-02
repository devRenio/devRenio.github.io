import fs from "node:fs/promises";
import path from "node:path";
import { mapMemberProfileFromJbch, stripInternalCodes } from "../shared/memberProfileCore.js";

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

function createJsonFileStore(filePath) {
  async function readAll() {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  }

  async function writeAll(data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  return { readAll, writeAll };
}

export function createFileProfileStore(filePath) {
  const { readAll, writeAll } = createJsonFileStore(filePath);

  return {
    async upsert(profile) {
      const userid = normalizeUserid(profile.userid);
      if (!userid) return;

      const all = await readAll();
      const existing = all[userid];
      const record = enrichMemberRecord(
        {
          ...profile,
          userid: profile.userid || userid,
        },
        existing,
      );

      all[userid] = record;
      await writeAll(all);
    },

    async listAll() {
      const all = await readAll();
      return sortMembers(Object.values(all));
    },
  };
}

function createFileConsentStore(filePath, membersStore) {
  const { readAll, writeAll } = createJsonFileStore(filePath);

  return {
    async hasConsent(userid) {
      const id = normalizeUserid(userid);
      if (!id) return false;
      const all = await readAll();
      return Boolean(all[id]);
    },

    async recordConsent(userid) {
      const id = normalizeUserid(userid);
      if (!id) return;

      const acceptedAt = new Date().toISOString();
      const all = await readAll();
      all[id] = { acceptedAt };
      await writeAll(all);

      const existing = await membersStore.listAll().then((members) =>
        members.find((item) => normalizeUserid(item.userid) === id),
      );
      if (existing) {
        await membersStore.upsert({ ...existing, acceptedAt });
      }
    },

    async getConsentAt(userid) {
      const id = normalizeUserid(userid);
      if (!id) return null;
      const all = await readAll();
      return all[id]?.acceptedAt ?? null;
    },
  };
}

export function createDevProfileStore(env) {
  const dataDir = String(env?.MEMBER_PROFILES_FILE ?? ".data/member-profiles.json");
  const membersPath = path.resolve(process.cwd(), dataDir);
  const consentsPath = path.resolve(
    process.cwd(),
    String(env?.MEMBER_CONSENTS_FILE ?? ".data/member-consents.json"),
  );

  const members = createFileProfileStore(membersPath);
  const consents = createFileConsentStore(consentsPath, members);

  return {
    upsert: members.upsert.bind(members),
    listAll: members.listAll.bind(members),
    hasConsent: consents.hasConsent.bind(consents),
    recordConsent: consents.recordConsent.bind(consents),
    getConsentAt: consents.getConsentAt.bind(consents),
  };
}

export function mapStoredMemberProfile(result) {
  return mapMemberProfileFromJbch(result);
}
