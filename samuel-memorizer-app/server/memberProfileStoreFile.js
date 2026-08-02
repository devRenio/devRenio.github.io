import fs from "node:fs/promises";
import path from "node:path";
import {
  ADMIN_DIRECTORY_REBUILD_MS,
  buildAdminDirectory,
  enrichMemberRecord,
  sortMembers,
  toAdminListEntry,
} from "./adminMemberCache.js";

function normalizeUserid(userid) {
  return String(userid ?? "").trim().toLowerCase();
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

function createFileProfileStore(filePath, metaPath) {
  const { readAll, writeAll } = createJsonFileStore(filePath);
  const metaStore = createJsonFileStore(metaPath);

  async function readMembers() {
    return readAll();
  }

  async function writeDirectoryFromMembers(all) {
    const members = sortMembers(Object.values(all));
    const directory = buildAdminDirectory(members);
    await metaStore.writeAll({
      lastFullRebuildAt: directory.updatedAt,
      updatedAt: directory.updatedAt,
      members: directory.members,
    });
    return {
      members: directory.members,
      cachedAt: directory.updatedAt,
      lastFullRebuildAt: directory.updatedAt,
    };
  }

  async function patchDirectoryEntry(record) {
    const meta = await metaStore.readAll();
    if (!Array.isArray(meta.members)) return;

    const entry = toAdminListEntry(record);
    const nextMembers = [...meta.members];
    const index = nextMembers.findIndex(
      (item) => normalizeUserid(item.userid) === normalizeUserid(record.userid),
    );

    if (index >= 0) {
      nextMembers[index] = entry;
    } else {
      nextMembers.push(entry);
    }

    const updatedAt = new Date().toISOString();
    await metaStore.writeAll({
      ...meta,
      updatedAt,
      members: sortMembers(nextMembers),
    });
  }

  return {
    async upsert(profile) {
      const userid = normalizeUserid(profile.userid);
      if (!userid) return;

      const all = await readMembers();
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
      await patchDirectoryEntry(record);
    },

    async listAll() {
      const all = await readMembers();
      return sortMembers(Object.values(all));
    },

    async listForAdmin() {
      const meta = await metaStore.readAll();
      if (Array.isArray(meta.members) && meta.members.length > 0) {
        return {
          members: meta.members,
          cachedAt: meta.updatedAt ?? null,
          lastFullRebuildAt: meta.lastFullRebuildAt ?? meta.updatedAt ?? null,
        };
      }

      return writeDirectoryFromMembers(await readMembers());
    },

    async getMember(userid) {
      const id = normalizeUserid(userid);
      if (!id) return null;
      const all = await readMembers();
      return all[id] ?? null;
    },

    async rebuildAdminDirectory() {
      return writeDirectoryFromMembers(await readMembers());
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

      const existing = await membersStore.getMember(id);
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
  const adminMetaPath = path.resolve(
    process.cwd(),
    String(env?.MEMBER_ADMIN_META_FILE ?? ".data/member-admin-directory.json"),
  );

  const members = createFileProfileStore(membersPath, adminMetaPath);
  const consents = createFileConsentStore(consentsPath, members);

  return {
    upsert: members.upsert.bind(members),
    listAll: members.listAll.bind(members),
    listForAdmin: members.listForAdmin.bind(members),
    getMember: members.getMember.bind(members),
    rebuildAdminDirectory: members.rebuildAdminDirectory.bind(members),
    hasConsent: consents.hasConsent.bind(consents),
    recordConsent: consents.recordConsent.bind(consents),
    getConsentAt: consents.getConsentAt.bind(consents),
  };
}

export { ADMIN_DIRECTORY_REBUILD_MS };
