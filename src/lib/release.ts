// Pure helper for the in-app update check (unit-tested in release.test.ts).

export interface ApkUpdate {
  build: number;
  version: string;
  url: string;
}

/** The release title carries the build number: "MaxFit v0.2.0 build 42". Pure, unit-tested. */
export function parseRelease(j: { name?: string; assets?: { name: string; browser_download_url: string }[] }): ApkUpdate | null {
  const m = /build (\d+)/.exec(j.name ?? '');
  const asset = j.assets?.find((a) => a.name === 'maxfit.apk');
  if (!m || !asset) return null;
  return { build: Number(m[1]), version: /v(\d+\.\d+\.\d+)/.exec(j.name ?? '')?.[1] ?? '', url: asset.browser_download_url };
}
