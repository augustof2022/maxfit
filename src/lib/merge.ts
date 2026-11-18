// Pure merge rule for sync (unit-tested in merge.test.ts).
// Last-write-wins per row by updatedAt, except the profile: unlocks and colours are a union,
// so no device can ever take away something another device earned.

type Row = { id: string; updatedAt: number; [k: string]: unknown };

function union(a: unknown, b: unknown): string[] {
  return [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])] as string[];
}

/** Returns the row to store locally, or null to keep the local row as it is. */
export function mergeRow(tbl: string, local: Row | undefined, remote: Row, now = Date.now()): Row | null {
  if (!local) return remote;
  if (tbl !== 'profile') return local.updatedAt < remote.updatedAt ? remote : null;

  const winner = local.updatedAt >= remote.updatedAt ? local : remote;
  // "Delete test data" stamps resetAt. A copy from before the newest reset must not add its old
  // unlocks and colours back, so then the lists come only from the side with the newest reset.
  const lr = Number(local.resetAt ?? 0);
  const rr = Number(remote.resetAt ?? 0);
  if (lr !== rr) {
    const fresh = lr > rr ? local : remote;
    const out = { ...winner, unlocked: fresh.unlocked, cosmetics: fresh.cosmetics, revealed: fresh.revealed, resetAt: Math.max(lr, rr) };
    if (winner === local && fresh === local) return null;
    if (winner === remote && fresh === remote) return remote;
    return { ...out, updatedAt: Math.max(now, local.updatedAt, remote.updatedAt) };
  }
  const unlocked = union(local.unlocked, remote.unlocked);
  const cosmetics = union(local.cosmetics, remote.cosmetics);
  // Shown moves: a union too (both devices showed them); undefined stays undefined (older app).
  const revealed = local.revealed === undefined && remote.revealed === undefined ? undefined : union(local.revealed, remote.revealed);
  const winnerHasAll =
    unlocked.length === union(winner.unlocked, []).length && cosmetics.length === union(winner.cosmetics, []).length && (revealed?.length ?? 0) === union(winner.revealed, []).length;
  if (winner === local && winnerHasAll) return null;
  // If the merged row differs from both copies, stamp it now so it is pushed back up.
  const remoteHasAll =
    unlocked.length === union(remote.unlocked, []).length && cosmetics.length === union(remote.cosmetics, []).length && (revealed?.length ?? 0) === union(remote.revealed, []).length;
  const updatedAt = winner === remote && remoteHasAll ? remote.updatedAt : Math.max(now, local.updatedAt, remote.updatedAt);
  return revealed === undefined ? { ...winner, unlocked, cosmetics, updatedAt } : { ...winner, unlocked, cosmetics, revealed, updatedAt };
}
