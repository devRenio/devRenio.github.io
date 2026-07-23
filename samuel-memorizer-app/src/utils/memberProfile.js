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

/** member_json result → 앱 프로필 객체 */
export function mapJbchMemberProfile(result) {
  if (!result || typeof result !== "object") return null;

  const sex = stringifyField(result.sex || result.sexori);

  return {
    name: stringifyField(result.username || result.name),
    church: stringifyField(result.churchname || result.church),
    email: stringifyField(result.email),
    userid: stringifyField(result.userid),
    mid: stringifyField(result.mid),
    chid: stringifyField(result.chid),
    avatar: stringifyField(result.avatar),
    sex,
    birth: stringifyField(result.birth),
    reborn: stringifyField(result.reborn),
    address: stringifyField(result.address),
    tel: stringifyField(result.tel),
    hand: stringifyField(result.hand),
    service: stringifyField(result.service),
    joinedAt: stringifyField(
      result.joinedAt ||
        result.createdAt ||
        result.acceptedAt ||
        result.updatedAt,
    ),
  };
}

export const ADMIN_MEMBER_DETAIL_FIELDS = [
  { key: "userid", label: "깨사모 아이디" },
  { key: "email", label: "이메일" },
  { key: "birth", label: "생년월일" },
  { key: "reborn", label: "거듭남 일자" },
  { key: "address", label: "주소" },
  { key: "tel", label: "전화" },
  { key: "hand", label: "휴대전화" },
  { key: "service", label: "선교회(섬김)" },
];

export function getMemberFieldDisplay(key, profile) {
  if (!profile) return "—";
  const value = profile[key];
  if (value == null || value === "") return "—";
  return value;
}
