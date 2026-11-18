import { useEffect, useState } from 'react';
import { applyWebUpdate, checkApkUpdate, installApk, onWebUpdate, startWebUpdates, webUpdateReady, type ApkUpdate } from '../lib/update';
import { Bar } from './ui';
import { Ico, RefreshCw } from './Icon';

const RECHECK_MS = 30 * 60_000;
// Module level: the bar remounts on every tab change; do not re-ask GitHub each time.
let lastCheck = 0;
let cached: ApkUpdate | null = null;

/** "New version ready · Update". Checks when the app opens and when it comes back to the front. */
export function UpdateBar() {
  const [apk, setApk] = useState<ApkUpdate | null>(cached);
  const [web, setWeb] = useState(webUpdateReady());
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    startWebUpdates();
    const off = onWebUpdate(() => setWeb(true));
    const check = () => {
      if (Date.now() - lastCheck < RECHECK_MS) return;
      lastCheck = Date.now();
      void checkApkUpdate().then((u) => {
        cached = u;
        setApk(u);
      });
    };
    check();
    const onVis = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      off();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  if (!apk && !web) return null;

  const update = async () => {
    setMsg(null);
    if (web) return applyWebUpdate();
    if (!apk) return;
    try {
      setPct(0);
      const r = await installApk(apk, setPct);
      if (r === 'needs_permission') setMsg('Allow "Install unknown apps" for MaxFit, come back, then tap Update again.');
      else setMsg('Tap Install on the next screen. Your data stays.');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setPct(null);
    }
  };

  return (
    <div className="update-bar" role="status">
      <span className="ico sm good" aria-hidden>
        <Ico as={RefreshCw} size={18} />
      </span>
      <div className="grow stack" style={{ gap: 4 }}>
        <b className="small">{apk ? `New version ready${apk.version ? ` (v${apk.version}, build ${apk.build})` : ''}` : 'New version ready'}</b>
        {pct !== null ? <Bar value={pct} max={100} tone="good" label="Downloading update" /> : <span className="note">{msg ?? 'Your data stays on the phone.'}</span>}
      </div>
      <button className="btn good" onClick={update} disabled={pct !== null}>
        {pct !== null ? `${pct}%` : 'Update'}
      </button>
    </div>
  );
}
