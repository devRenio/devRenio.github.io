export const ADMIN_MEMBER_SORT_OPTIONS = [
  { id: "name", label: "이름순" },
  { id: "church", label: "교회별" },
  { id: "joined", label: "가입일순" },
];

function compareName(a, b) {
  return (a.name || a.userid || "").localeCompare(
    b.name || b.userid || "",
    "ko",
  );
}

export function sortAdminMembers(members, sortBy) {
  const list = [...members];

  switch (sortBy) {
    case "church":
      return list.sort((a, b) => {
        const churchCmp = (a.church || "—").localeCompare(
          b.church || "—",
          "ko",
        );
        if (churchCmp !== 0) return churchCmp;
        return compareName(a, b);
      });
    case "joined":
      return list.sort((a, b) => {
        const aTime = Date.parse(a.joinedAt || "") || 0;
        const bTime = Date.parse(b.joinedAt || "") || 0;
        if (aTime !== bTime) return aTime - bTime;
        return compareName(a, b);
      });
    case "name":
    default:
      return list.sort((a, b) => {
        const nameCmp = compareName(a, b);
        if (nameCmp !== 0) return nameCmp;
        return (a.userid || "").localeCompare(b.userid || "", "ko");
      });
  }
}
