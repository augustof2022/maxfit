// Draws a progress photo with the chosen stats on top, as a finished picture (PNG/JPEG blob).
// Three looks: clean (bottom fade + grid), bold (one big number), card (frosted glass card).
// Sizes: story 1080x1920 (9:16), post 1080x1350 (4:5) — the sizes Instagram uses for each.

export type PhotoTemplate = 'clean' | 'bold' | 'card';
export type PhotoSize = 'story' | 'post';
export interface StatLine {
  key: string;
  label: string;
  value: string;
}

export const TEMPLATES: { id: PhotoTemplate; name: string }[] = [
  { id: 'clean', name: 'Clean' },
  { id: 'bold', name: 'Bold' },
  { id: 'card', name: 'Glass card' },
];

export const SIZES: Record<PhotoSize, { w: number; h: number; label: string }> = {
  story: { w: 1080, h: 1920, label: 'Story 9:16' },
  post: { w: 1080, h: 1350, label: 'Post 4:5' },
};

const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Read a picked file as an image the canvas can draw, the right way up. */
export async function loadImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

function canvasBlob(c: HTMLCanvasElement, type: string, q?: number): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the picture'))), type, q));
}

/** Smaller copy for storage (long side 1440 px, JPEG). */
export async function shrink(img: ImageBitmap | HTMLImageElement, max = 1440): Promise<Blob> {
  const w = img.width;
  const h = img.height;
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return canvasBlob(c, 'image/jpeg', 0.86);
}

function cover(ctx: CanvasRenderingContext2D, img: ImageBitmap | HTMLImageElement, W: number, H: number) {
  const k = Math.max(W / img.width, H / img.height);
  const w = img.width * k;
  const h = img.height * k;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'left' | 'right' = 'left') {
  const chars = [...text];
  const width = chars.reduce((t, ch) => t + ctx.measureText(ch).width + spacing, -spacing);
  let cx = align === 'right' ? x - width : x;
  for (const ch of chars) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number, weight: number, size: number): number {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(text).width > maxW && s > 20) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

const DID_HEAD = 46; // header row height of the "I did" block

/** At most `max` lines; if there are more, the last one becomes "+N more". */
export function clampDid(lines: string[], max: number): string[] {
  if (max <= 0) return [];
  if (lines.length <= max) return lines;
  if (max === 1) return [`+${lines.length} more`];
  return [...lines.slice(0, max - 1), `+${lines.length - max + 1} more`];
}

/** Draws the "I did" block: a small header, then one line per exercise. Returns its height. */
function drawDid(ctx: CanvasRenderingContext2D, o: { title: string; lines: string[]; x: number; top: number; w: number; lineH: number; size: number; accent: string; shadow: boolean }): number {
  ctx.save();
  if (o.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = o.accent;
  ctx.fillRect(o.x, o.top + 4, 6, 24);
  ctx.fillStyle = 'rgba(255,255,255,.78)';
  ctx.font = `800 24px ${FONT}`;
  spaced(ctx, o.title, o.x + 20, o.top + 26, 4);
  o.lines.forEach((t, i) => {
    const more = /^\+\d+ more$/.test(t);
    ctx.fillStyle = more ? 'rgba(255,255,255,.7)' : '#ffffff';
    fit(ctx, t, o.w, more ? 600 : 750, more ? Math.round(o.size * 0.8) : o.size);
    ctx.fillText(t, o.x, o.top + DID_HEAD + (i + 1) * o.lineH - (o.lineH - o.size) / 2 - 4);
  });
  ctx.restore();
  return DID_HEAD + o.lines.length * o.lineH;
}

/** How many "I did" lines fit in `space` px (max 6). */
function didFit(space: number, lineH: number): number {
  return Math.max(0, Math.min(6, Math.floor((space - DID_HEAD) / lineH)));
}

export async function renderPhoto(
  img: ImageBitmap | HTMLImageElement,
  opts: { template: PhotoTemplate; size: PhotoSize; stats: StatLine[]; note: string; date: string; accent: string; did?: string[]; didTitle?: string },
): Promise<Blob> {
  const { w: W, h: H } = SIZES[opts.size];
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.textBaseline = 'alphabetic';
  cover(ctx, img, W, H);
  const pad = 72;
  const stats = opts.stats.slice(0, 6);
  const white = '#ffffff';
  const soft = 'rgba(255,255,255,.72)';
  const did = opts.did ?? [];
  const didTitle = opts.didTitle ?? 'I DID';
  const darken = (from: number, to: number) => {
    const g = ctx.createLinearGradient(0, from, 0, to);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, from, W, to - from);
    // Then stay dark to the bottom, so there is no hard edge where the template's own fade starts.
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(0, to, W, H - to);
  };

  // Brand mark, top right, small and quiet.
  const brand = () => {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = `800 30px ${FONT}`;
    spaced(ctx, 'MAXFIT', W - pad, pad + 26, 6, 'right');
    ctx.fillStyle = opts.accent;
    ctx.fillRect(W - pad - 18, pad + 40, 18, 5);
  };

  if (opts.template === 'clean') {
    const top = H * 0.48;
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.55, 'rgba(0,0,0,.55)');
    g.addColorStop(1, 'rgba(0,0,0,.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, top, W, H - top);
    const tg = ctx.createLinearGradient(0, 0, 0, 260);
    tg.addColorStop(0, 'rgba(0,0,0,.45)');
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, W, 260);
    brand();
    const rows = Math.ceil(stats.length / 2);
    const rowH = 150;
    const y = H - pad - rows * rowH + 40;
    if (did.length) {
      // Stack the "I did" block above the date (and caption), below the brand mark.
      const textTop = opts.note ? y - 118 - 56 : y - 70 - 34;
      const lineH = 54;
      const n = didFit(textTop - 36 - (pad + 110), lineH);
      const lines = clampDid(did, n);
      if (lines.length) {
        const top = textTop - 36 - DID_HEAD - lines.length * lineH;
        if (top < H * 0.48) darken(Math.max(0, top - 160), top + 60);
        drawDid(ctx, { title: didTitle, lines, x: pad, top, w: W - pad * 2, lineH, size: 40, accent: opts.accent, shadow: true });
      }
    }
    ctx.fillStyle = soft;
    ctx.font = `700 28px ${FONT}`;
    spaced(ctx, opts.date.toUpperCase(), pad, y - 70, 4);
    ctx.fillStyle = opts.accent;
    ctx.fillRect(pad, y - 50, 64, 6);
    if (opts.note) {
      ctx.fillStyle = white;
      fit(ctx, opts.note, W - pad * 2, 800, 52);
      ctx.fillText(opts.note, pad, y - 118);
    }
    const colW = (W - pad * 2) / 2;
    stats.forEach((st, i) => {
      const x = pad + (i % 2) * colW;
      const yy = y + Math.floor(i / 2) * rowH;
      ctx.fillStyle = soft;
      ctx.font = `700 26px ${FONT}`;
      spaced(ctx, st.label.toUpperCase(), x, yy + 20, 3);
      ctx.fillStyle = white;
      fit(ctx, st.value, colW - 24, 800, 72);
      ctx.fillText(st.value, x, yy + 100);
    });
  } else if (opts.template === 'bold') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,.62)');
    g.addColorStop(0.35, 'rgba(0,0,0,.05)');
    g.addColorStop(0.7, 'rgba(0,0,0,.05)');
    g.addColorStop(1, 'rgba(0,0,0,.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    brand();
    const [hero, ...rest] = stats;
    let heroBottom = pad + 60;
    if (hero) {
      ctx.fillStyle = soft;
      ctx.font = `700 30px ${FONT}`;
      spaced(ctx, hero.label.toUpperCase(), pad, pad + 150, 5);
      ctx.fillStyle = white;
      const s = fit(ctx, hero.value, W - pad * 2, 900, 190);
      ctx.fillText(hero.value, pad - 6, pad + 150 + s * 0.95);
      ctx.fillStyle = opts.accent;
      ctx.fillRect(pad, pad + 150 + s * 0.95 + 34, 120, 10);
      heroBottom = pad + 150 + s * 0.95 + 44;
    }
    ctx.fillStyle = white;
    ctx.font = `700 30px ${FONT}`;
    const y = H - pad - (rest.length - 1) * 64;
    if (did.length) {
      // Above the caption and the stat list, below the big number.
      const textTop = opts.note ? y - 90 - 52 : y - 46;
      const lineH = 56;
      const n = didFit(textTop - 40 - (heroBottom + 50), lineH);
      const lines = clampDid(did, n);
      if (lines.length) {
        const top = textTop - 40 - DID_HEAD - lines.length * lineH;
        darken(Math.max(0, top - 140), top + 40);
        drawDid(ctx, { title: didTitle, lines, x: pad, top, w: W - pad * 2, lineH, size: 42, accent: opts.accent, shadow: true });
      }
    }
    ctx.fillStyle = white;
    ctx.font = `700 30px ${FONT}`;
    if (opts.note) {
      fit(ctx, opts.note, W - pad * 2, 800, 50);
      ctx.fillText(opts.note, pad, y - 90);
    }
    rest.forEach((st, i) => {
      ctx.fillStyle = soft;
      ctx.font = `700 30px ${FONT}`;
      ctx.fillText(st.label, pad, y + i * 64);
      ctx.fillStyle = white;
      ctx.font = `800 40px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(st.value, W - pad, y + i * 64);
      ctx.textAlign = 'left';
    });
    ctx.fillStyle = soft;
    ctx.font = `700 24px ${FONT}`;
    spaced(ctx, opts.date.toUpperCase(), pad, pad + 26, 4);
  } else {
    // Glass card: blur the photo behind a rounded card.
    const cols = Math.min(3, Math.max(1, stats.length));
    const rows = Math.ceil(stats.length / cols) || 1;
    const baseH = 150 + rows * 150 + (opts.note ? 70 : 0);
    const didLineH = 48;
    // The card grows to hold the "I did" lines, but never climbs over the brand mark.
    const didLines = did.length ? clampDid(did, didFit(H - pad - baseH - (pad + 110) - 40, didLineH)) : [];
    const didH = didLines.length ? DID_HEAD + didLines.length * didLineH + 40 : 0;
    const cardH = baseH + didH;
    const x = pad - 24;
    const y = H - pad - cardH;
    const w = W - (pad - 24) * 2;
    const r = 44;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, cardH, r);
    ctx.clip();
    ctx.filter = 'blur(28px) brightness(.6)';
    cover(ctx, img, W, H);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(15,17,21,.35)';
    ctx.fillRect(x, y, w, cardH);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, cardH, r);
    ctx.stroke();
    brand();
    const ix = x + 48;
    let iy = y + 70;
    ctx.fillStyle = soft;
    ctx.font = `700 26px ${FONT}`;
    spaced(ctx, opts.date.toUpperCase(), ix, iy, 4);
    ctx.fillStyle = opts.accent;
    ctx.fillRect(ix, iy + 18, 56, 6);
    if (opts.note) {
      iy += 78;
      ctx.fillStyle = white;
      fit(ctx, opts.note, w - 96, 800, 46);
      ctx.fillText(opts.note, ix, iy);
    }
    if (didLines.length) {
      iy += 50;
      iy += drawDid(ctx, { title: didTitle, lines: didLines, x: ix, top: iy, w: w - 96, lineH: didLineH, size: 36, accent: opts.accent, shadow: false });
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      ctx.fillRect(ix, iy + 22, w - 96, 2);
      iy += 10;
    }
    const colW = (w - 96) / cols;
    stats.forEach((st, i) => {
      const cx = ix + (i % cols) * colW;
      const cy = iy + 80 + Math.floor(i / cols) * 150;
      ctx.fillStyle = soft;
      ctx.font = `700 22px ${FONT}`;
      spaced(ctx, st.label.toUpperCase(), cx, cy, 3);
      ctx.fillStyle = white;
      fit(ctx, st.value, colW - 20, 800, 60);
      ctx.fillText(st.value, cx, cy + 74);
    });
  }
  return canvasBlob(c, 'image/jpeg', 0.92);
}
