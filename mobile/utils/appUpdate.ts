export interface AppRelease {
  version: string;
  versionCode: number;
  releasedAt?: string;
}

export function shouldOfferUpdate(
  installedVersionCode: number,
  availableVersionCode: number
): boolean {
  if (!Number.isFinite(installedVersionCode) || !Number.isFinite(availableVersionCode)) {
    return false;
  }
  if (!Number.isInteger(availableVersionCode) || availableVersionCode <= 0) {
    return false;
  }
  return availableVersionCode > installedVersionCode;
}

export function parseAppRelease(body: unknown): AppRelease | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as { version?: unknown; versionCode?: unknown; releasedAt?: unknown };
  const versionCode = typeof record.versionCode === 'number'
    ? record.versionCode
    : Number(record.versionCode);
  const version = typeof record.version === 'string' ? record.version : '';
  if (!version || !Number.isInteger(versionCode) || versionCode <= 0) {
    return null;
  }
  return {
    version,
    versionCode,
    releasedAt: typeof record.releasedAt === 'string' ? record.releasedAt : undefined,
  };
}
