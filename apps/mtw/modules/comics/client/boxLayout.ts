// Pure geometry of one box exactly as the reader lays it out on the desktop page (comic-story.js placeCrops and o.fs):
// the box has the layout rect's shape, the art region (inset) covers it at the crop focus, and the lettering size follows
// the page's short side. Units are percentages of the box, so the result scales with the Studio stage.

export type Rect4 = [number, number, number, number];
export interface BoxGeometry { r: Rect4 | null; ar: Rect4 | null; focus: [number, number]; insetPct: number }
export interface BoxFrame {
  /** Box width / height. */
  aspect: number;
  /** The page art image, placed in percent of the box. */
  img: { widthPct: number; leftPct: number; topPct: number };
  /** Lettering font size as a percentage of the box width (use as cqw). */
  fontCqw: number;
}

/** The reader's page width the lettering is measured against: measured 2026-10-11 on the live reader in a 1664x919
 * window, where the Home tower box was 542 px wide (r w 0.343) and every caption was set at 15 px Kalam. */
export const REFERENCE_PAGE_PX = 1580;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function boxFrame(g: BoxGeometry, art: { width: number; height: number }, pagePx = REFERENCE_PAGE_PX): BoxFrame | null {
  const r = g.r ?? g.ar;
  const a = g.ar ?? g.r;
  if (!r || !a || !(art.width > 0) || !(art.height > 0) || !(r[2] > 0) || !(r[3] > 0)) return null;
  const AW = art.width, AH = art.height;
  const bw = r[2] * AW, bh = r[3] * AH;
  const ins = (Math.min(AW, AH) * clamp(g.insetPct, 0, 5)) / 100;
  const rx = a[0] * AW + ins, ry = a[1] * AH + ins, rw = Math.max(1, a[2] * AW - 2 * ins), rh = Math.max(1, a[3] * AH - 2 * ins);
  const fx = clamp(g.focus[0], 0, 1), fy = clamp(g.focus[1], 0, 1);
  const s = Math.max(bw / rw, bh / rh);
  const ox = rx * s + (rw * s - bw) * fx, oy = ry * s + (rh * s - bh) * fy;
  // comic-story.js o.fs: the cap height is 1.2% of the BOX's short side (9-14 px), the font cap/0.7, never under 15 px.
  const boxW = r[2] * pagePx, boxH = (r[3] * pagePx * AH) / AW;
  const fs = Math.max(clamp((Math.min(boxW, boxH) * 1.2) / 100, 9, 14) / 0.7, 15);
  return {
    aspect: bw / bh,
    img: { widthPct: ((AW * s) / bw) * 100, leftPct: (-ox / bw) * 100, topPct: (-oy / bh) * 100 },
    fontCqw: (fs / boxW) * 100,
  };
}

/** Fit and clip an isolated native source ROI into its own slot, independent of the room's cover crop. */
export function placedLayerFrame(placement: { sourceROI: Rect4; slot: Rect4; fit: 'contain' }, art: { width: number; height: number }, aspect: number) {
  const a = placement.sourceROI, slot = placement.slot;
  if (!(aspect > 0 && art.width > 0 && art.height > 0 && a[2] > 0 && a[3] > 0 && slot[2] > 0 && slot[3] > 0)) return null;
  const rw = a[2] * art.width, rh = a[3] * art.height, W = slot[2] * aspect, H = slot[3];
  const scale = Math.min(W / rw, H / rh), width = rw * scale, height = rh * scale;
  return {
    bounds: { leftPct: (slot[0] + (W - width) / (2 * aspect)) * 100, topPct: (slot[1] + (H - height) / 2) * 100, widthPct: width / aspect * 100, heightPct: height * 100 },
    img: { widthPct: 100 / a[2], leftPct: -a[0] / a[2] * 100, topPct: -a[1] / a[3] * 100 },
  };
}
