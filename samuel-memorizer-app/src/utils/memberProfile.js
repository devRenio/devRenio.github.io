import {
  getAdminDetailFields,
  getMemberFieldDisplay,
  mapMemberProfileFromJbch,
  stripInternalCodes,
} from "../../shared/memberProfileCore.js";

export {
  getAdminDetailFields,
  getMemberFieldDisplay,
  mapMemberProfileFromJbch,
  stripInternalCodes,
} from "../../shared/memberProfileCore.js";

/** member_json result → 앱 프로필 객체 */
export function mapJbchMemberProfile(result) {
  return mapMemberProfileFromJbch(result);
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
