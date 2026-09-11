import type { Pen } from "../pen";
import type { Color } from "../types";
import type { ShieldShape as Shape, ShieldBlazon as Blazon, ShieldEmblem as Emblem, ShieldParts } from "../types";
import { Vector } from "../math";
import { colorLerp, colorDarken, colorStr } from "../color";
import { Rng } from "../rng";
import {
  STEEL,
  GOLD,
  WOOD,
  DARK,
  BONE,
  BRONZE,
  DARKIRON,
  VERDIGRIS,
  pickWood,
  pickMarble,
  pickHammeredMetal,
  pickBone,
  pickGem,
  pickCrystal,
  pickShieldPaint,
  SHIELD_PAINTS,
  type Ramp,
} from "../palette";

/**
 * Mix-and-match shield: a body silhouette from several classic profiles
 * (heater, kite, tower, round, crest, teardrop…), a *blazon* — the field's
 * surface, either a worked material/texture (planked wood, marble, hammered
 * bronze, bone, dragon scale, leather, wicker weave, verdigris patina,
 * crystal…) or a two-tone geometric pattern (halves, quarters, stripes,
 * checker, diamonds) — and a centrepiece emblem (boss, gem, cross, mullet
 * star, chevron, or none). The blazon is purely the background; the metal
 * frame/rim is a separate layer added on top elsewhere. Unlike the other
 * weapons — drawn along the bottom-left→top-right diagonal — a shield is
 * body-centred and roughly bilaterally symmetric, so it gets its own
 * coordinate frame: `dx` = offset from the vertical centreline, `t` =
 * normalised height (0 top, 1 bottom).
 */

const SHAPES: Shape[] = [
  "heater", "heater", "kite", "tower", "round", "crest", "teardrop", "heater", "kite", "crest",
  "lozenge", "hexagon", "scallop",
];
const BLAZONS: Blazon[] = [
  "planked", "marble", "hammered", "bone",
  "scaled", "leather", "weave", "verdigris", "crystal",
  "half-vertical", "half-horizontal", "half-diagonal", "quarters",
  "stripes-vertical", "stripes-horizontal", "stripes-diagonal",
  "checker", "diamonds",
];

/** The two-tone geometric blazons — patterns rather than worked materials.
 *  They render as two heraldic tinctures split by a region test, not a base
 *  ramp + surface texture, so they take a separate path in {@link fieldColor}. */
const GEOMETRIC = new Set<Blazon>([
  "half-vertical", "half-horizontal", "half-diagonal", "quarters",
  "stripes-vertical", "stripes-horizontal", "stripes-diagonal",
  "checker", "diamonds",
]);

/** Heraldic tincture pool for the geometric patterns: the vivid shield paints
 *  plus a couple of metals/neutrals so a pattern can pair e.g. gold-on-azure. */
const TINCTURES: Ramp[] = [...SHIELD_PAINTS, GOLD, BONE, STEEL, DARK];
const EMBLEMS: Emblem[] = ["boss", "boss", "gem", "cross", "cross", "star", "chevron", "none"];

const pick = <T,>(r: Rng, arr: T[]): T => arr[Math.floor(r.float() * arr.length) % arr.length]!;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Half-width of the silhouette at normalised height `t` (0 top .. 1 bottom),
 *  in the shield's own frame (fraction of `maxHalf`, already scaled in). */
function halfWidthAt(shape: Shape, t: number): number {
  switch (shape) {
    case "tower": {
      // Boxy: near-full width almost to the bottom, then a shallow round-off —
      // a flat-bottomed pavise/tower shield, not a point.
      const botRound = 0.86;
      if (t < botRound) return 1;
      const u = (t - botRound) / (1 - botRound);
      return 1 - 0.62 * Math.pow(u, 1.4);
    }
    case "kite": {
      // Domed top arc (apex at t=0, full width at topArc), then a long sharp
      // taper to a point — the tall Norman kite silhouette.
      const topArc = 0.24;
      if (t <= topArc) {
        const u = t / topArc;
        return Math.sqrt(Math.max(0, 1 - (1 - u) * (1 - u)));
      }
      const u = (t - topArc) / (1 - topArc);
      return Math.max(0, 1 - Math.pow(u, 1.1));
    }
    case "teardrop": {
      // Wide rounded top, body stays round longer before a soft point.
      const topArc = 0.34;
      if (t <= topArc) {
        const u = t / topArc;
        return Math.sqrt(Math.max(0, 1 - (1 - u) * (1 - u)));
      }
      const u = (t - topArc) / (1 - topArc);
      return Math.max(0, 1 - Math.pow(u, 1.55));
    }
    case "crest": {
      // The outer edge itself tapers to a point over the top band too — combined
      // with the centre notch below, the two halves read as pointed horns/ears
      // rather than a flat-topped block.
      const flare = 1.08;
      const topFlat = 0.17;
      if (t <= topFlat) return flare * Math.pow(t / topFlat, 0.75);
      const u = (t - topFlat) / (1 - topFlat);
      return flare * Math.max(0, 1 - Math.pow(u, 1.3));
    }
    case "lozenge": {
      // Diamond: a point top and bottom, full width at the vertical middle —
      // the Scottish heraldic lozenge silhouette.
      return Math.max(0, 1 - Math.abs(t - 0.5) * 2);
    }
    case "hexagon": {
      // Flat shoulder band, a diagonal taper, then a shorter flat foot band —
      // a faceted Renaissance cartouche rather than a tapered point.
      const topFlat = 0.22;
      const botFlat = 0.82;
      const footWidth = 0.55;
      if (t <= topFlat) return 1;
      if (t >= botFlat) return footWidth;
      const u = (t - topFlat) / (botFlat - topFlat);
      return 1 - u * (1 - footWidth);
    }
    case "scallop": {
      // Heater-ish flat top and near-straight sides; the bottom notch (cut in
      // `scallopNotchCut`) forks the hem into two rounded lobes.
      const topFlat = 0.14;
      if (t <= topFlat) return 1;
      const u = (t - topFlat) / (1 - topFlat);
      return 1 - 0.15 * u;
    }
    case "heater":
    default: {
      const topFlat = 0.14;
      if (t <= topFlat) return 1;
      const u = (t - topFlat) / (1 - topFlat);
      return Math.max(0, 1 - Math.pow(u, 1.3));
    }
  }
}

/** The crest's scalloped top-centre notch: a shallow V dividing two "horns". */
function crestNotchCut(nx: number, t: number): boolean {
  const notchHalf = 0.22;
  const notchDepth = 0.16;
  if (Math.abs(nx) >= notchHalf) return false;
  const centerness = 1 - Math.abs(nx) / notchHalf;
  return t < notchDepth * centerness;
}

/** The scallop's forked-hem bottom notch: a shallow V rising from the bottom
 *  centre, mirroring `crestNotchCut` but carving the hem instead of the crown. */
function scallopNotchCut(nx: number, t: number): boolean {
  const notchHalf = 0.2;
  const notchDepth = 0.16;
  if (Math.abs(nx) >= notchHalf) return false;
  const centerness = 1 - Math.abs(nx) / notchHalf;
  return t > 1 - notchDepth * centerness;
}

interface Sample {
  /** -1 (left) .. 1 (right), 0 on the centreline / at the shield's own centre. */
  nx: number;
  /** -1 (top) .. 1 (bottom). */
  ny: number;
  /** Approx. distance in px from this pixel to the nearest silhouette edge. */
  edgeDist: number;
}

interface Metrics {
  cx: number;
  top: number;
  H: number;
  maxHalf: number;
}

/** Classify a canvas pixel against the shield silhouette. Returns null when
 *  the pixel is outside the shape. Shared by the field fill, the rim band,
 *  and the chevron emblem overlay so geometry only lives in one place. */
function sample(shape: Shape, dx: number, y: number, m: Metrics): Sample | null {
  if (shape === "round") {
    const radius = m.maxHalf;
    const cy = m.top + m.H / 2;
    const dyc = y - cy;
    const d = Math.hypot(dx, dyc);
    if (d > radius) return null;
    return { nx: dx / radius, ny: dyc / radius, edgeDist: radius - d };
  }
  const t = clamp01((y - m.top) / m.H);
  const hw = halfWidthAt(shape, t) * m.maxHalf;
  const nxRaw = m.maxHalf > 0 ? dx / m.maxHalf : 0;
  if (Math.abs(dx) > hw) return null;
  if (shape === "crest" && crestNotchCut(nxRaw, t)) return null;
  if (shape === "scallop" && scallopNotchCut(nxRaw, t)) return null;
  const edgeSide = hw - Math.abs(dx);
  const hasFlatTop = shape === "heater" || shape === "tower" || shape === "crest" || shape === "hexagon" || shape === "scallop";
  const edgeTop = hasFlatTop ? y - m.top : Infinity;
  return { nx: hw > 0 ? dx / hw : 0, ny: t * 2 - 1, edgeDist: Math.min(edgeSide, edgeTop) };
}

/**
 * A blazon is the field's *material/texture* (not a heraldic division). Each
 * one gets a characteristic colour ramp plus, in {@link fieldColor}, a
 * procedural surface texture. The base ramp alone already separates the
 * blazons by hue; the texture is what sells the material.
 */
function blazonBase(blazon: Blazon, r: Rng): Ramp {
  switch (blazon) {
    case "planked": return pickWood(r);
    case "marble": return pickMarble(r);
    case "hammered": return pickHammeredMetal(r);
    case "bone": return pickBone(r);
    case "scaled": return pickShieldPaint(r);
    case "leather": return DARK;
    case "weave": return WOOD;
    case "verdigris": return VERDIGRIS;
    case "crystal": return pickCrystal(r);
    default: return STEEL;
  }
}

/** Per-shield random constants a blazon's texture may need (plank phase, scale
 *  row offset, paint tint…), rolled once so the texture is stable across the
 *  whole field. `alt` is the second tincture for the geometric patterns. */
interface FieldState {
  base: Ramp;
  alt: Ramp;
  seed: number;
}

const colorMix = (a: Color, b: Color, t: number): Color => colorLerp(a, b, clamp01(t));

/** Cheap deterministic 2D hash (classic fract-sin), 0..1 — for jittering
 *  texture lattices so patterns read organic rather than machined. */
const hash2 = (x: number, y: number, s: number): number => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Even/odd parity of a coordinate band, negative-safe (JS `%` keeps sign). */
const evenBand = (n: number): boolean => (((Math.floor(n) % 2) + 2) % 2) === 0;

/**
 * Which tincture a geometric pattern paints at this pixel: `true` → `base`,
 * `false` → `alt`. The "half"/"quarters" splits use the shape-normalised
 * nx/ny so they divide at the shield's own centre on any silhouette; the
 * stripes/checker/diamonds use the pixel grid so their scale stays constant.
 */
function geoIsBase(blazon: Blazon, s: Sample, dx: number, y: number, dscale: number, seed: number): boolean {
  const stripe = Math.max(3, Math.round(5 * dscale));
  const cell = Math.max(3, Math.round(6 * dscale));
  const ox = seed % stripe;
  switch (blazon) {
    case "half-vertical": return s.nx < 0;
    case "half-horizontal": return s.ny < 0;
    case "half-diagonal": return s.nx + s.ny < 0;
    case "quarters": return (s.nx < 0) === (s.ny < 0);
    case "stripes-vertical": return evenBand((dx + ox) / stripe);
    case "stripes-horizontal": return evenBand((y + ox) / stripe);
    case "stripes-diagonal": return evenBand((dx + y + ox) / stripe);
    case "checker": return evenBand(dx / cell) === evenBand(y / cell);
    case "diamonds": return evenBand((dx + y) / cell) === evenBand((dx - y) / cell);
    default: return true;
  }
}

/**
 * Per-pixel field colour for a blazon. `lt` is the silhouette's directional
 * light term (0 shadow .. 1 lit); `dx`/`y` are canvas coords, `s` the shape
 * sample. "planked" and "marble" are fully worked so far — the rest fall back
 * to a plain shaded material fill until each is built out one at a time.
 */
function fieldColor(blazon: Blazon, s: Sample, dx: number, y: number, dscale: number, lt: number, fs: FieldState): Color {
  const base = fs.base;
  if (GEOMETRIC.has(blazon)) {
    const ramp = geoIsBase(blazon, s, dx, y, dscale, fs.seed) ? fs.base : fs.alt;
    return colorLerp(ramp.shadow, ramp.light, lt);
  }
  switch (blazon) {
    case "planked":
      return planked(base, dx, y, dscale, lt, fs.seed);
    case "marble":
      return marble(base, dx, y, lt, fs.seed);
    case "hammered":
      return hammered(base, dx, y, dscale, lt, fs.seed);
    case "bone":
      return bone(base, dx, y, dscale, lt, fs.seed);
    default:
      return colorLerp(base.shadow, base.light, lt);
  }
}

/**
 * Blazon #1 — Planked: vertical butted boards. Each board is barrel-shaded
 * across its width (lit toward the top-left edge, dropping into a dark seam
 * groove at every board join) and carries faint wavering grain streaks so the
 * wood reads as sawn timber rather than a flat brown gradient.
 */
function planked(base: Ramp, dx: number, y: number, dscale: number, lt: number, seed: number): Color {
  const plankW = Math.max(3, Math.round(4.5 * dscale));
  // Offset the plank grid by a per-shield phase so the seams don't always land
  // on the centreline.
  const gx = dx + seed * 0.7;
  const phase = ((gx % plankW) + plankW) % plankW;
  const u = phase / plankW; // 0..1 across the board

  // Base directional shade, then a gentle cross-board barrel highlight/shadow:
  // brightest just left of centre (top-left light), darkening toward the right.
  const barrel = 0.5 + 0.5 * Math.cos((u - 0.38) * Math.PI * 1.6);
  let color = colorMix(base.shadow, base.light, lt * (0.72 + 0.28 * barrel));

  // Seam groove: a dark hairline at each board boundary (u≈0 / u≈1).
  const seam = Math.min(u, 1 - u);
  if (seam < 0.10) {
    color = colorDarken(color, 0.5);
  } else if (seam < 0.18) {
    color = colorDarken(color, 0.22);
  }

  // Grain: slow vertical streaks that waver with height, a few per board.
  const grain = Math.sin(gx * 1.9 + Math.sin(y * 0.35 + seed) * 0.8);
  if (grain > 0.72) color = colorDarken(color, 0.14);
  else if (grain < -0.86) color = colorMix(color, base.spec, 0.12);

  return color;
}

/**
 * Blazon #2 — Marble: polished stone. A bright, softly top-left-lit body
 * carries flowing dark veins produced by a domain-warped sine field: a couple
 * of thick primary seams with a soft dark halo, plus scattered hairline
 * veins, so the stone reads as figured marble rather than a flat panel.
 * `base.shadow` is the vein colour; `base.mid`→`base.spec` are the stone body.
 */
function marble(base: Ramp, dx: number, y: number, lt: number, seed: number): Color {
  const s = seed * 0.7;
  // Polished body: bright, gently graded toward the top-left light.
  let color = colorMix(base.mid, base.spec, clamp01(0.18 + lt * 0.82));

  // Warp the sampling coords so veins wander organically instead of ruling
  // straight lines across the stone.
  const warp = Math.sin((y + s) * 0.11) * 5 + Math.cos((dx - s) * 0.08) * 4;

  // Primary veins: where the warped field crosses zero.
  const f1 = Math.sin((dx + warp) * 0.20 + s) + 0.5 * Math.sin((y - warp) * 0.16);
  const v1 = Math.abs(f1);
  if (v1 < 0.10) color = colorMix(base.shadow, color, 0.15 + (v1 / 0.10) * 0.5);
  else if (v1 < 0.24) color = colorMix(color, base.shadow, 0.12);

  // Fine secondary hairlines on a different frequency/axis.
  const f2 = Math.sin((dx * 0.6 - y * 0.5 + warp) * 0.5 + s * 1.7);
  if (Math.abs(f2) < 0.05) color = colorMix(color, base.shadow, 0.3);

  return color;
}

/**
 * Blazon #3 — Hammered: planished bronze. A cellular lattice of *jittered*
 * facets tiles the whole surface (nearest-node / Worley style), so the hammer
 * marks read as an irregular hand-beaten field rather than a machined grid.
 * Each facet is a shallow planished bump — its rim brightens on the top-left
 * flank and darkens on the bottom-right — laid over the bronze's directional
 * sheen, with an occasional specular glint on a facet crown.
 */
function hammered(base: Ramp, dx: number, y: number, dscale: number, lt: number, seed: number): Color {
  const cell = Math.max(4, Math.round(5 * dscale));
  const cxn = Math.round(dx / cell);
  const cyn = Math.round(y / cell);

  // Nearest jittered node across the 3×3 neighbourhood → this pixel's facet.
  let bx = 0;
  let by = 0;
  let bd = Infinity;
  for (let ix = -1; ix <= 1; ix++) {
    for (let iy = -1; iy <= 1; iy++) {
      const nix = cxn + ix;
      const niy = cyn + iy;
      const jx = (hash2(nix, niy, seed) - 0.5) * cell * 0.8;
      const jy = (hash2(nix, niy, seed + 17) - 0.5) * cell * 0.8;
      const ex = dx - (nix * cell + jx);
      const ey = y - (niy * cell + jy);
      const d = ex * ex + ey * ey;
      if (d < bd) { bd = d; bx = ex; by = ey; }
    }
  }

  const rad = cell * 0.85;
  const nrm = clamp01(Math.sqrt(bd) / rad); // 0 crown .. 1 facet rim
  const facing = -(bx + by) / (rad * Math.SQRT2); // +1 top-left flank, -1 bottom-right

  // Bronze sheen + planished rim shading (only the rim carries the facet form,
  // so crowns stay smooth like real planished metal).
  const t = 0.28 + lt * 0.5 + facing * 0.26 * nrm;
  let color = colorMix(base.shadow, base.spec, clamp01(t));

  // Dark pits where adjacent facets meet on the shadow side.
  if (nrm > 0.82 && facing < -0.1) color = colorDarken(color, 0.2);
  // Rare bright glint on a top-left-facing crown.
  if (nrm < 0.3 && facing > 0.55) color = colorMix(color, base.spec, 0.5);

  return color;
}

/**
 * Blazon #5 — Bone: pale, porous plate worked from a shield boss or turtle
 * carapace. A soft low-frequency mottle gives the surface faint density
 * variation, and a network of thin, brittle stress-crack hairlines — higher
 * frequency and more tightly thresholded than marble's veins, so they read as
 * fractures rather than figuring — runs across it.
 */
function bone(base: Ramp, dx: number, y: number, dscale: number, lt: number, seed: number): Color {
  const s = seed * 0.53;
  let color = colorMix(base.mid, base.light, clamp01(0.25 + lt * 0.75));

  // Porous mottling: fine chalky speckle, not large blotches — higher
  // frequency and a gentler push than a first pass that read as bruising.
  const mf = 0.55 / Math.max(0.6, dscale * 0.5);
  const mottle = Math.sin(dx * mf + s) * Math.cos(y * mf * 1.3 - s * 0.7);
  if (mottle > 0.7) color = colorMix(color, base.light, 0.1);
  else if (mottle < -0.72) color = colorDarken(color, 0.06);

  // Hairline stress cracks: a warped, brittle zero-crossing field, thresholded
  // tight so they stay thin. Uses `colorDarken` (a pure multiplicative scale)
  // rather than blending toward a fixed `shadow` swatch — that keeps the
  // result exactly on bone's own hue line at every strength. A blend toward a
  // *different* absolute colour can drift into the gap between a light
  // ramp's widely-spaced stops, which the global palette-snap then matches to
  // some unrelated material's mid tone instead (bit us here with marble).
  const warp = Math.sin((y + s) * 0.22) * 3 + Math.cos((dx - s) * 0.19) * 2.4;
  const f = Math.sin((dx + warp) * 0.34 + s * 1.3) + 0.6 * Math.sin((y - warp) * 0.29 - s);
  const v = Math.abs(f);
  if (v < 0.035) color = colorDarken(color, 0.4);
  else if (v < 0.07) color = colorDarken(color, 0.16);

  return color;
}

export function drawShield(pen: Pen, parts?: ShieldParts): void {
  pen.rng.checkpoint();
  const r = pen.rng;
  const B = pen.dimension;
  const dscale = B / 32;

  pen.clearCanvas();

  const shape = parts?.shape ?? pick(r, SHAPES);

  const marginX = Math.max(1, Math.round(B * 0.11));
  const marginTop = Math.max(1, Math.round(B * 0.08));
  const marginBottom = Math.max(1, Math.round(B * 0.035));
  const top = marginTop;
  const H = B - 1 - marginBottom - top;
  const cx = (B - 1) / 2;
  const fullHalf = (B - 1 - 2 * marginX) / 2;
  const widthScale = shape === "kite" ? 0.74 : shape === "teardrop" ? 0.86 : shape === "crest" ? 0.94 : 1;
  const maxHalf = shape === "round" ? Math.min(fullHalf, H / 2) : fullHalf * widthScale;
  const m: Metrics = { cx, top, H, maxHalf };

  // -- field: the blazon is the surface material / texture, edge to edge -----
  // No metal rim / rivets / brackets here — those are a separate "frame" layer
  // added on top later. A blazon is purely the texture that fills the shape.
  const blazon: Blazon = parts?.blazon ?? pick(r, BLAZONS);
  let base: Ramp;
  let alt: Ramp;
  if (GEOMETRIC.has(blazon)) {
    base = pick(r, TINCTURES);
    alt = pick(r, TINCTURES);
    for (let g = 0; g < 8 && alt === base; g++) alt = pick(r, TINCTURES);
  } else {
    base = blazonBase(blazon, r);
    alt = base;
  }
  const fs: FieldState = { base, alt, seed: r.range(0, 997) };
  const isCrystal = blazon === "crystal";
  const isMetal = blazon === "hammered";

  // Light from the top-left, matching the pack's directional convention.
  const lx = -0.6;
  const ly = -0.62;

  for (let x = 0; x < B; x++) {
    for (let y = 0; y < B; y++) {
      const dx = x - cx;
      const s = sample(shape, dx, y, m);
      if (!s) continue;

      const lt = clamp01(0.5 + 0.5 * (s.nx * lx + s.ny * ly));
      const color = fieldColor(blazon, s, dx, y, dscale, lt, fs);
      pen.ctx.fillStyle = colorStr(color);
      pen.drawPixel(x, y);
    }
  }

  // -- centrepiece emblem -----------------------------------------------------
  const emblem = parts?.emblem ?? pick(r, EMBLEMS);
  const centerY = top + H * (shape === "round" || shape === "lozenge" ? 0.5 : shape === "tower" ? 0.46 : 0.4);
  const center = new Vector(cx, centerY);
  const er = Math.min(maxHalf, H * 0.5) * (shape === "round" ? 0.6 : 0.5);
  const accent = pick(r, [GOLD, STEEL, GOLD, BRONZE, DARKIRON]);
  let gemColorForGlow: Color | null = null;

  if (emblem === "boss") {
    pen.drawRoundOrnamentHelper({ center, radius: Math.max(1.5, er * 0.62), colorLight: accent.light, colorDark: accent.shadow });
  } else if (emblem === "gem") {
    const gem = isCrystal ? pickCrystal(r) : pickGem(r);
    pen.drawRoundOrnamentHelper({ center, radius: Math.max(1.4, er * 0.46), colorLight: gem.light, colorDark: gem.shadow });
    gemColorForGlow = gem.light;
  } else if (emblem === "cross") {
    drawCross(pen, center, er, accent);
  } else if (emblem === "star") {
    drawMullet(pen, center, er, r.float() < 0.5 ? 4 : 5, accent, r);
  } else if (emblem === "chevron") {
    drawChevron(pen, shape, m, accent, r);
  }

  const weatherAmt = isCrystal ? 0.25 : isMetal ? 0.7 : 0.4;
  pen.weather(r.floatLow() * weatherAmt, { rust: isMetal });
  pen.addBorder();

  if (gemColorForGlow) pen.drawGlow(center, er * 1.9, gemColorForGlow);
}

/** A thick heraldic "+", two overlapping beveled bars centred on `c`. */
function drawCross(pen: Pen, c: Vector, er: number, ramp: Ramp): void {
  const arm = er * 0.92;
  const half = Math.max(0.9, er * 0.24);
  pen.fillCone(c.x, c.y, 0, -1, 0, arm, half, ramp.light, ramp.shadow);
  pen.fillCone(c.x, c.y, 0, 1, 0, arm, half, ramp.light, ramp.shadow);
  pen.fillCone(c.x, c.y, -1, 0, 0, arm, half, ramp.light, ramp.shadow);
  pen.fillCone(c.x, c.y, 1, 0, 0, arm, half, ramp.light, ramp.shadow);
}

/** A radial mullet / heraldic star: `n` short beveled rays from the centre. */
function drawMullet(pen: Pen, c: Vector, er: number, n: number, ramp: Ramp, r: Rng): void {
  const start = r.rangeFloat(0, Math.PI * 2);
  const half = Math.max(0.9, er * 0.22);
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    pen.fillCone(c.x, c.y, Math.cos(a), Math.sin(a), 0, er * 0.85, half, ramp.light, ramp.shadow);
  }
  pen.drawRoundOrnamentHelper({ center: c, radius: Math.max(1, half * 1.1), colorLight: ramp.light, colorDark: ramp.shadow });
}

/** A diagonal accent band painted across the already-filled field. */
function drawChevron(pen: Pen, shape: Shape, m: Metrics, ramp: Ramp, r: Rng): void {
  const width = Math.max(1.4, m.maxHalf * 0.22);
  const dir = r.sign();
  const litStr = colorStr(ramp.light);
  const midStr = colorStr(ramp.mid);
  for (let x = 0; x < pen.dimension; x++) {
    for (let y = 0; y < pen.dimension; y++) {
      const dx = x - m.cx;
      const s = sample(shape, dx, y, m);
      if (!s) continue;
      const band = dir * dx + s.ny * m.maxHalf;
      if (Math.abs(band) > width) continue;
      pen.ctx.fillStyle = band < 0 ? litStr : midStr;
      pen.drawPixel(x, y);
    }
  }
}
