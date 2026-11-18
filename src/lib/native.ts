// Bridge to MaxFit's own Android code (android/.../MaxFitNativePlugin.java):
// app version, download + install an update, save a file to the phone, share a file.
// In the web app the same helpers fall back to browser features.

import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

interface MaxFitNativePlugin {
  getAppInfo(): Promise<{ versionName: string; versionCode: number }>;
  downloadAndInstall(o: { url: string }): Promise<{ status: 'installing' | 'needs_permission' }>;
  saveToDevice(o: { base64: string; fileName: string; mime: string; folder: 'pictures' | 'downloads' }): Promise<{ uri: string }>;
  shareFile(o: { base64: string; fileName: string; mime: string; text?: string }): Promise<void>;
  addListener(event: 'downloadProgress', cb: (e: { percent: number }) => void): Promise<PluginListenerHandle>;
}

export const isNativeApp = Capacitor.isNativePlatform();
export const MaxFitNative = registerPlugin<MaxFitNativePlugin>('MaxFitNative');

export function blobToBase64(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
}

function download(blob: Blob, fileName: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** Save to the phone: photos to Pictures/MaxFit (gallery), other files to Downloads. */
export async function saveFile(blob: Blob, fileName: string, folder: 'pictures' | 'downloads'): Promise<string> {
  if (!isNativeApp) {
    download(blob, fileName);
    return 'Downloaded';
  }
  await MaxFitNative.saveToDevice({ base64: await blobToBase64(blob), fileName, mime: blob.type || 'application/octet-stream', folder });
  return folder === 'pictures' ? 'Saved to your gallery (Pictures/MaxFit)' : 'Saved to Downloads';
}

/** Open the phone's share menu (Instagram, Facebook, Messenger, ...). */
export async function shareFile(blob: Blob, fileName: string, text?: string): Promise<'shared' | 'downloaded'> {
  if (isNativeApp) {
    await MaxFitNative.shareFile({ base64: await blobToBase64(blob), fileName, mime: blob.type || 'image/png', text });
    return 'shared';
  }
  const file = new File([blob], fileName, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text });
    return 'shared';
  }
  download(blob, fileName);
  return 'downloaded';
}
