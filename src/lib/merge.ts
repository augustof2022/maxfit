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
  const unlocked = union(local.unlocked, remote.unlocked);
  const cosmetics = union(local.cosmetics, remote.cosmetics);
  const winnerHasAll = unlocked.length === union(winner.unlocked, []).length && cosmetics.length === union(winner.cosmetics, []).length;
  if (winner === local && winnerHasAll) return null;
  // If the merged row differs from both copies, stamp it now so it is pushed back up.
  const remoteHasAll = unlocked.length === union(remote.unlocked, []).length && cosmetics.length === union(remote.cosmetics, []).length;
  const updatedAt = winner === remote && remoteHasAll ? remote.updatedAt : Math.max(now, local.updatedAt, remote.updatedAt);
  return { ...winner, unlocked, cosmetics, updatedAt };
}
