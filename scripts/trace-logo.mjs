// Traces the ZB monogram (public/brand/logo-mark.png) into vector outlines for the 3D emblem.
//   node scripts/trace-logo.mjs   ->  src/components/home/zb-shapes.json
// Marching squares over the alpha channel (2x upsampled for smooth edges), loops joined, simplified,
// then grouped into { outline, holes } so three.js can extrude them.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCALE = 2, T = 0.5, EPS = 0.22, TARGET = 3; // TARGET = width of the finished logo in scene units

const meta = await sharp(join(ROOT, "public/brand/logo-mark.png")).metadata();
const W0 = meta.width, H0 = meta.height;
const { data } = await sharp(join(ROOT, "public/brand/logo-mark.png")).ensureAlpha().extractChannel(3).resize(W0 * SCALE, H0 * SCALE, { kernel: "lanczos3" }).raw().toBuffer({ resolveWithObject: true });
const W = W0 * SCALE + 2, H = H0 * SCALE + 2; // 1px transparent frame so every shape closes
const v = (x, y) => (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1 ? 0 : data[(y - 1) * (W - 2) + (x - 1)] / 255);

// --- marching squares -> segments between edge keys
const pts = new Map(); // edge key -> [x, y]
const adj = new Map(); // edge key -> [edge keys]
const lerp = (a, b) => (T - a) / (b - a);
function edge(key, x, y, kind, a, b) {
  if (!pts.has(key)) pts.set(key, kind === "h" ? [x + lerp(a, b), y] : [x, y + lerp(a, b)]);
  return key;
}
const link = (a, b) => { (adj.get(a) ?? adj.set(a, []).get(a)).push(b); (adj.get(b) ?? adj.set(b, []).get(b)).push(a); };

for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
  const tl = v(x, y), tr = v(x + 1, y), br = v(x + 1, y + 1), bl = v(x, y + 1);
  const c = (tl > T ? 8 : 0) | (tr > T ? 4 : 0) | (br > T ? 2 : 0) | (bl > T ? 1 : 0);
  if (c === 0 || c === 15) continue;
  const top = () => edge(`h${x},${y}`, x, y, "h", tl, tr);
  const bottom = () => edge(`h${x},${y + 1}`, x, y + 1, "h", bl, br);
  const left = () => edge(`v${x},${y}`, x, y, "v", tl, bl);
  const right = () => edge(`v${x + 1},${y}`, x + 1, y, "v", tr, br);
  const seg = { 1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]], 5: [[top, right], [left, bottom]], 6: [[top, bottom]], 7: [[top, left]], 8: [[top, left]], 9: [[top, bottom]], 10: [[top, left], [bottom, right]], 11: [[top, right]], 12: [[left, right]], 13: [[bottom, right]], 14: [[left, bottom]] }[c];
  for (const [p, q] of seg) link(p(), q());
}

// --- join into loops
const used = new Set();
const loops = [];
for (const start of adj.keys()) {
  if (used.has(start)) continue;
  const loop = [];
  let prev = null, cur = start;
  while (cur && !used.has(cur)) {
    used.add(cur); loop.push(pts.get(cur));
    const next = adj.get(cur).find((n) => n !== prev && !used.has(n));
    prev = cur; cur = next;
  }
  if (loop.length > 8) loops.push(loop);
}

// --- Douglas-Peucker (closed loops)
function dp(points, eps) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0], [bx, by] = points[points.length - 1];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  let max = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= eps) return [points[0], points[points.length - 1]];
  return [...dp(points.slice(0, idx + 1), eps).slice(0, -1), ...dp(points.slice(idx), eps)];
}
const simplify = (loop) => { const h = Math.floor(loop.length / 2); const a = dp(loop.slice(0, h + 1), EPS), b = dp([...loop.slice(h), loop[0]], EPS); return [...a.slice(0, -1), ...b.slice(0, -1)]; };

const area = (p) => p.reduce((s, [x, y], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + (x * y2 - x2 * y); }, 0) / 2;
const inside = ([px, py], poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c; } return c; };

const polys = loops.map(simplify).filter((p) => Math.abs(area(p)) > 6 * SCALE * SCALE).map((p) => ({ p, a: Math.abs(area(p)) }));
polys.forEach((l) => { l.depth = polys.filter((o) => o !== l && inside(l.p[0], o.p)).length; });

// --- normalise: centre on the bbox, flip Y, scale so the width = TARGET
const xs = polys.flatMap((l) => l.p.map((q) => q[0])), ys = polys.flatMap((l) => l.p.map((q) => q[1]));
const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
const k = TARGET / (Math.max(...xs) - Math.min(...xs));
const norm = (p) => p.map(([x, y]) => [+((x - cx) * k).toFixed(4), +(-(y - cy) * k).toFixed(4)]);

const shapes = polys.filter((l) => l.depth % 2 === 0).map((outer) => ({
  outline: norm(outer.p),
  holes: polys.filter((h) => h.depth === outer.depth + 1 && inside(h.p[0], outer.p)).map((h) => norm(h.p)),
}));

const out = { width: TARGET, height: +((Math.max(...ys) - Math.min(...ys)) * k).toFixed(4), shapes };
writeFileSync(join(ROOT, "src/components/home/zb-shapes.json"), JSON.stringify(out));
console.log(`traced ${loops.length} loops -> ${shapes.length} shapes, ${shapes.reduce((n, s) => n + s.outline.length + s.holes.reduce((m, h) => m + h.length, 0), 0)} points, ${out.width} x ${out.height}`);
