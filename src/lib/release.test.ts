import { describe, expect, it } from 'vitest';
import { parseRelease } from './release';

const asset = { name: 'maxfit.apk', browser_download_url: 'https://github.com/augustof2022/maxfit/releases/download/apk-latest/maxfit.apk' };

describe('update check', () => {
  it('reads the build number and the APK link from the release', () => {
    expect(parseRelease({ name: 'MaxFit v0.2.0 build 42', assets: [asset] })).toEqual({ build: 42, version: '0.2.0', url: asset.browser_download_url });
  });
  it('ignores an old-style release (no build number) or one without the APK', () => {
    expect(parseRelease({ name: 'MaxFit Android app (latest test build)', assets: [asset] })).toBeNull();
    expect(parseRelease({ name: 'MaxFit v0.2.0 build 42', assets: [] })).toBeNull();
  });
});
