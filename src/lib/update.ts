// "A new version is ready: Update" (Renz, 2026-11-18).
// Android app: compares its build number with the latest signed APK on the GitHub release
//   "apk-latest" (title "MaxFit vX build N"), downloads it and opens Android's installer.
// Web app: the service worker finds the new files; Update reloads into them.

import { registerSW } from 'virtual:pwa-register';
import { isNativeApp, MaxFitNative } from './native';
import { parseRelease, type ApkUpdate } from './release';

export type { ApkUpdate };

const RELEASE_API = 'https://api.github.com/repos/augustof2022/maxfit/releases/tags/apk-latest';

export async function appVersion(): Promise<{ name: string; build: number }> {
  if (isNativeApp) {
    const i = await MaxFitNative.getAppInfo();
    return { name: i.versionName, build: Number(i.versionCode) };
  }
  return { name: __APP_VERSION__, build: Number(import.meta.env.VITE_APP_BUILD ?? 0) };
}

/** Null when up to date, offline, or not the Android app. */
export async function checkApkUpdate(): Promise<ApkUpdate | null> {
  if (!isNativeApp || !navigator.onLine) return null;
  try {
    const [mine, r] = await Promise.all([appVersion(), fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } })]);
    if (!r.ok) return null;
    const latest = parseRelease(await r.json());
    return latest && latest.build > mine.build ? latest : null;
  } catch {
    return null;
  }
}

/** Download the APK (progress 0-100) and open the installer. Returns what happened. */
export async function installApk(u: ApkUpdate, onProgress: (pct: number) => void): Promise<'installing' | 'needs_permission'> {
  const h = await MaxFitNative.addListener('downloadProgress', (e) => onProgress(e.percent));
  try {
    return (await MaxFitNative.downloadAndInstall({ url: u.url })).status;
  } finally {
    await h.remove();
  }
}

// ---- web app (PWA) ----
let webUpdate: (() => Promise<void>) | null = null;
const listeners = new Set<() => void>();

export function onWebUpdate(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function webUpdateReady(): boolean {
  return webUpdate !== null;
}
export function applyWebUpdate(): Promise<void> {
  return webUpdate?.() ?? Promise.resolve();
}

let registered = false;
/** Call once at start (web only). Checks for new files now and every 30 minutes. */
export function startWebUpdates(): void {
  if (registered || isNativeApp || !('serviceWorker' in navigator)) return;
  registered = true;
  const update = registerSW({
    onNeedRefresh() {
      webUpdate = () => update(true);
      listeners.forEach((l) => l());
    },
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => void reg.update(), 30 * 60_000);
    },
  });
}
