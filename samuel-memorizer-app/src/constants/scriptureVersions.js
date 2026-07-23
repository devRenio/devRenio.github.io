export function getVersionById(manifest, versionId) {
  if (!manifest?.versions?.length) return null;
  return (
    manifest.versions.find((item) => item.id === versionId) ??
    manifest.versions.find((item) => item.id === manifest.defaultVersionId) ??
    manifest.versions[0]
  );
}

export function resolveInitialVersionId(manifest, savedVersionId) {
  if (!manifest?.versions?.length) return null;
  if (
    savedVersionId &&
    manifest.versions.some((item) => item.id === savedVersionId)
  ) {
    return savedVersionId;
  }
  return manifest.defaultVersionId ?? manifest.versions[0].id;
}
