/**
 * Travel Line booking API expects the base umrah package id (e.g. UP-101084).
 * Synced ticket legs use suffixed external ids: UP-101084-out / UP-101084-ret.
 * Group flight inventory uses MongoDB group ids directly.
 */
export function resolveTravelLinePackageId(externalId: string | null | undefined): string {
  if (!externalId) return "";
  return externalId.replace(/-(out|ret)$/i, "");
}

export function isTravelLineGroupId(externalId: string | null | undefined): boolean {
  return Boolean(externalId && /^[a-f0-9]{24}$/i.test(externalId));
}
