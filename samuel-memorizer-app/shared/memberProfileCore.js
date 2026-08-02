const EXCLUDED_JBCH_KEYS = new Set(["mid", "chid"]);

export const ADMIN_PROFILE_LABELS = {
  userid: "깨사모 아이디",
  name: "이름",
  sex: "성별",
  church: "교회",
  email: "이메일",
  birth: "생년월일",
  reborn: "거듭남 일자",
  address: "주소",
  tel: "전화",
  hand: "휴대전화",
  service: "선교회(섬김)",
  joinedAt: "가입일",
  createdAt: "최초 저장",
  updatedAt: "정보 갱신",
};

const ADMIN_DETAIL_ORDER = [
  "userid",
  "name",
  "sex",
  "church",
  "email",
  "birth",
  "reborn",
  "address",
  "tel",
  "hand",
  "service",
  "joinedAt",
  "createdAt",
  "updatedAt",
];

export function stringifyMemberField(value) {
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

/** member_json result → 저장·표시용 프로필 (mid/chid 제외) */
export function mapMemberProfileFromJbch(result) {
  if (!result || typeof result !== "object") return null;

  const userid = stringifyMemberField(result.userid);
  if (!userid) return null;

  const profile = {
    userid,
    name: stringifyMemberField(result.username || result.name),
    church: stringifyMemberField(result.churchname || result.church),
    email: stringifyMemberField(result.email),
    sex: stringifyMemberField(result.sex || result.sexori),
    avatar: stringifyMemberField(result.avatar),
    birth: stringifyMemberField(result.birth),
    reborn: stringifyMemberField(result.reborn),
    address: stringifyMemberField(result.address),
    tel: stringifyMemberField(result.tel),
    hand: stringifyMemberField(result.hand),
    service: stringifyMemberField(result.service),
  };

  for (const [key, value] of Object.entries(result)) {
    if (EXCLUDED_JBCH_KEYS.has(key)) continue;
    if (Object.prototype.hasOwnProperty.call(profile, key)) continue;
    const normalized = stringifyMemberField(value);
    if (normalized) profile[key] = normalized;
  }

  return profile;
}

export function stripInternalCodes(profile) {
  if (!profile || typeof profile !== "object") return profile;
  const next = { ...profile };
  delete next.mid;
  delete next.chid;
  return next;
}

export function getAdminDetailFields(profile) {
  if (!profile) return [];

  const hiddenKeys = new Set(["mid", "chid", "avatar", "acceptedAt"]);
  const fields = [];
  const seen = new Set();

  for (const key of ADMIN_DETAIL_ORDER) {
    if (hiddenKeys.has(key)) continue;
    const value = profile[key];
    if (value == null || value === "") continue;
    fields.push({
      key,
      label: ADMIN_PROFILE_LABELS[key] ?? key,
    });
    seen.add(key);
  }

  for (const key of Object.keys(profile).sort()) {
    if (hiddenKeys.has(key) || seen.has(key)) continue;
    const value = profile[key];
    if (value == null || value === "") continue;
    fields.push({
      key,
      label: ADMIN_PROFILE_LABELS[key] ?? key,
    });
  }

  return fields;
}

export function getMemberFieldDisplay(key, profile) {
  if (!profile) return "—";
  const value = profile[key];
  if (value == null || value === "") return "—";
  return value;
}
