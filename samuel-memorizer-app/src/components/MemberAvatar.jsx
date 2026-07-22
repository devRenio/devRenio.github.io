import { useState } from "react";

export default function MemberAvatar({ src, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);
  const trimmed = String(src ?? "").trim();

  if (!trimmed || failed) {
    return (
      <span
        className={["info-account-avatar", "info-account-avatar--empty", className]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={trimmed}
      alt={alt}
      className={["info-account-avatar", "info-account-avatar--photo", className]
        .filter(Boolean)
        .join(" ")}
      onError={() => setFailed(true)}
    />
  );
}
