// "Are you sure?" for every edit and delete (Renz, 2026-11-18).
// Call `confirmAsk({...})` anywhere; <ConfirmHost/> (in App) shows the sheet and resolves true / false.

import { useSyncExternalStore } from 'react';
import { Sheet } from './ui';

export interface ConfirmOptions {
  title: string;
  body?: string;
  ok?: string;
  danger?: boolean;
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let pending: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function confirmAsk(opts: ConfirmOptions): Promise<boolean> {
  pending?.resolve(false); // only one question at a time
  return new Promise((resolve) => {
    pending = { ...opts, resolve };
    emit();
  });
}

function close(ok: boolean) {
  const p = pending;
  pending = null;
  emit();
  p?.resolve(ok);
}

export function ConfirmHost() {
  const p = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pending,
  );
  if (!p) return null;
  return (
    <Sheet onClose={() => close(false)}>
      <h2>{p.title}</h2>
      {p.body && <p className="muted">{p.body}</p>}
      <div className="row" style={{ marginTop: 'var(--s2)' }}>
        <button className="btn secondary grow" onClick={() => close(false)} autoFocus>
          Cancel
        </button>
        <button className={`btn grow ${p.danger ? 'danger solid' : 'primary'}`} onClick={() => close(true)}>
          {p.ok ?? 'Yes'}
        </button>
      </div>
    </Sheet>
  );
}
