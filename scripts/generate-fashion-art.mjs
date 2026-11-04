// Generates ALL storefront artwork as fashion illustrations (women wearing the collection) — no API, no downloads.
//   node scripts/generate-fashion-art.mjs
// Writes public/products/*.svg (2 views per demo product) and public/art/*.svg (hero, banners, tiles, pages).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COLORS, PRODUCT_SPECS } from "../src/lib/mock/specs.ts";
import { GOLD, SKIN, darken, drawModel, lighten, mix } from "./lib/fashion.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTS = join(ROOT, "public", "products");
const ART = join(ROOT, "public", "art");
mkdirSync(PRODUCTS, { recursive: true });
mkdirSync(ART, { recursive: true });

const SKINS = [SKIN.fair, SKIN.warm, SKIN.tan, SKIN.deep];
const HAIRS = ["#2A1A17", "#3B2418", "#1C1416", "#4A2C20"];
const noise = `<filter id="nz"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .05 0"/></filter>`;

let counter = 0;
const uid = () => `u${counter++}`;

const svg = (w, h, defs, body, view) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view ?? `0 0 ${w} ${h}`}" preserveAspectRatio="xMidYMid slice"><defs>${defs}${noise}</defs>${body}</svg>\n`;
const save = (path, content) => { writeFileSync(path, content); };

/** One model (or garment) placed in a scene: centred on x, top at y, scaled. */
function place(spec, x, y, scale) {
  const m = drawModel(spec);
  return { defs: m.defs, body: `<g transform="translate(${(x - 450 * scale).toFixed(1)},${y}) scale(${scale})">${m.body}</g>` };
}

function snow(w, h, n, seed = 3, color = "#fff") {
  let s = seed, out = "";
  const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  for (let i = 0; i < n; i++) out += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h).toFixed(0)}" r="${(1.5 + r() * 3.5).toFixed(1)}" fill="${color}" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`;
  return out;
}

function arch(cx, top, w, h, fill, op = 1) {
  return `<path d="M${cx - w / 2},${top + h} V${top + w / 2} a${w / 2},${w / 2} 0 0 1 ${w},0 V${top + h} Z" fill="${fill}" opacity="${op}"/>`;
}

// ---------- backdrops ----------
const backdrop = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

function studio(w, h, tint, { floor = true, archSide = true } = {}) {
  const a = lighten(tint, 0.86), b = lighten(tint, 0.68);
  const defs = backdrop("bg", a, b);
  let body = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  if (archSide) body += arch(w * 0.5, h * 0.06, w * 0.62, h * 0.94, lighten(tint, 0.9), 0.7) + `<circle cx="${w * 0.5}" cy="${h * 0.42}" r="${w * 0.34}" fill="${lighten(tint, 0.78)}" opacity=".6"/>`;
  if (floor) body += `<ellipse cx="${w / 2}" cy="${h * 0.955}" rx="${w * 0.36}" ry="${h * 0.02}" fill="#000" opacity=".12"/>`;
  return { defs, body };
}

// ---------- products ----------
const SIZES = ["S", "M", "L", "XL"];
void SIZES;
PRODUCT_SPECS.forEach((p, i) => {
  const color = COLORS[p.colors[0]].hex;
  const base = { sil: p.sil, color, pattern: p.pattern };
  for (const view of [1, 2]) {
    const k = i + (view - 1) * 3;
    const u = uid();
    const m = drawModel({ ...base, uid: u, skin: SKINS[k % 4], hairColor: HAIRS[(k + 1) % 4], hair: k % 2 ? "bun" : "long", pose: k % 3 === 1 ? "hip" : "hang" });
    const bg = studio(900, 1200, view === 1 ? color : mix(color, "#7E4452", 0.5), { archSide: view === 1 });
    const crop = view === 1 ? undefined : "100 30 700 933";
    save(join(PRODUCTS, `${p.slug}-${view}.svg`), svg(900, 1200, bg.defs + m.defs, bg.body + m.body, crop));
  }
});
console.log(`products: ${PRODUCT_SPECS.length * 2} images`);

// ---------- site art ----------
const P = (slug) => PRODUCT_SPECS.find((p) => p.slug === slug);
const spec = (slug, extra = {}) => { const p = P(slug); return { sil: p.sil, color: COLORS[p.colors[0]].hex, pattern: p.pattern, ...extra }; };
const colored = (slug, colorKey, extra = {}) => ({ ...spec(slug), color: COLORS[colorKey].hex, ...extra });

function scene(name, w, h, bgFn, models, extra = "") {
  const bg = bgFn(w, h);
  let defs = bg.defs, body = bg.body;
  models.forEach((m, i) => {
    const r = place({ uid: uid(), skin: SKINS[i % 4], hairColor: HAIRS[i % 4], hair: i % 2 ? "bun" : "long", pose: i % 3 === 1 ? "hip" : "hang", ...m.spec }, m.x, m.y, m.s);
    defs += r.defs; body += r.body;
  });
  save(join(ART, `${name}.svg`), svg(w, h, defs, body + extra));
}

const warm = (a, b, tint) => (w, h) => ({
  defs: backdrop("bg", a, b),
  body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>${arch(w * 0.72, h * 0.04, w * 0.34, h * 0.96, tint, 0.55)}${arch(w * 0.48, h * 0.12, w * 0.2, h * 0.88, tint, 0.3)}<rect y="${h * 0.93}" width="${w}" height="${h * 0.07}" fill="#000" opacity=".06"/>`,
});

// hero (landscape): four models on the right, text space on the left
scene("hero", 1920, 1080, warm("#FDF8F6", "#F2D5DA", "#F8E3E6"), [
  { spec: spec("panel-anarkali-leaf-green"), x: 880, y: 70, s: 0.84 },
  { spec: spec("embroidered-anarkali-deep-maroon", { pose: "hip" }), x: 1160, y: 40, s: 0.88 },
  { spec: spec("satin-gown-wine"), x: 1440, y: 70, s: 0.84 },
  { spec: spec("cotton-salwar-set-blush"), x: 1700, y: 90, s: 0.8 },
], snow(1920, 1080, 26, 9, "#fff"));
scene("hero-mobile", 900, 1600, warm("#FDF8F6", "#F2D5DA", "#F8E3E6"), [
  { spec: spec("floral-anarkali-royal-blue"), x: 300, y: 250, s: 1.0 },
  { spec: spec("embroidered-gown-royal-blue", { color: COLORS.rose.hex }), x: 620, y: 300, s: 0.95 },
]);
// banner (wide, christmas)
scene("banner", 1600, 600, (w, h) => ({
  defs: backdrop("bg", "#2D5A3D", "#17382A"),
  body: `<rect width="${w}" height="${h}" fill="url(#bg)"/><circle cx="1180" cy="300" r="270" fill="#fff" opacity=".07"/>${snow(w, h, 60, 5)}`,
}), [
  { spec: spec("christmas-velvet-frock-red"), x: 1000, y: 10, s: 0.48 },
  { spec: spec("christmas-gown-red", { pose: "hip" }), x: 1230, y: 0, s: 0.5 },
  { spec: spec("festive-cord-set-wine", { color: COLORS.red.hex }), x: 1450, y: 10, s: 0.48 },
]);
// story
scene("story", 900, 1200, warm("#FBEFEA", "#EBCBCF", "#F8E3E6"), [{ spec: spec("chanderi-salwar-set-teal", { pose: "hip" }), x: 450, y: 0, s: 1 }]);

// home tiles + collection art
const tile = (name, slug, tintA, tintB, opts = {}) => scene(name, 900, 1200, (w, h) => ({
  defs: backdrop("bg", tintA, tintB),
  body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>${arch(w * 0.5, h * 0.05, w * 0.7, h * 0.95, "#fff", 0.14)}${opts.snow ? snow(w, h, 48, 7) : ""}<ellipse cx="450" cy="1150" rx="300" ry="20" fill="#000" opacity=".16"/>`,
}), [{ spec: opts.spec ?? spec(slug), x: 450, y: 0, s: 1 }]);
tile("tile-new", "floral-anarkali-royal-blue", "#F6E2E6", "#E3B5BF");
tile("tile-festive", "christmas-velvet-frock-red", "#2D5A3D", "#17382A", { snow: true });
tile("tile-ethnic", "embroidered-anarkali-deep-maroon", "#F7EAD9", "#E3C79F");
tile("tile-signature", "satin-gown-wine", "#E8CBD2", "#B97A8A");
tile("tile-best", "cotton-salwar-set-blush", "#DCEFE6", "#A9D4BF");
tile("collection-1", "flared-anarkali-set-olive", "#EFE8D6", "#CFC49A");
tile("collection-2", "floral-cord-set-blush", "#F9E4E8", "#E7B4C0");
tile("collection-3", "tiered-frock-blush-pink", "#E6EEF9", "#B8CDEB");
tile("collection-4", "pleated-gown-dusty-rose", "#F3E0E3", "#D9A7B2");

// page art (landscape)
const small = (name, slug, tint, icon, o = {}) => scene(name, 1200, 800, (w, h) => ({
  defs: backdrop("bg", lighten(tint, 0.85), lighten(tint, 0.6)),
  body: `<rect width="${w}" height="${h}" fill="url(#bg)"/><circle cx="780" cy="400" r="300" fill="#fff" opacity=".35"/>${icon}`,
}), [{ spec: spec(slug, o), x: 780, y: 20, s: 0.62 }]);
const stroke = (inner) => `<g fill="none" stroke="${darken("#B96E7C", 0.1)}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" opacity=".8">${inner}</g>`;
small("contact", "cotton-salwar-set-blush", "#B96E7C", stroke(`<rect x="140" y="270" width="300" height="200" rx="14"/><path d="M140,290 L290,400 L440,290"/>`), { pose: "hip" });
small("track", "co-ord-set-olive", "#6B6B2F", stroke(`<path d="M290,250 L430,312 V452 L290,514 L150,452 V312 Z"/><path d="M150,312 L290,374 L430,312 M290,374 V514"/>`));
small("not-found", "bow-frock-black", "#7A2B4A", stroke(`<path d="M120,300 H460 M160,300 V560 M420,300 V560"/><path d="M290,300 v-20 q0,-20 20,-20"/>`), { pose: "hip" });

// placeholder (garment on a hanger, no model)
{
  const u = uid();
  const m = drawModel({ uid: u, sil: "anarkali", color: "#B96E7C", pattern: "plain", model: false });
  const bg = studio(900, 1200, "#B96E7C", { archSide: false });
  save(join(ART, "placeholder.svg"), svg(900, 1200, bg.defs + m.defs, bg.body + `<g transform="translate(0,60)">${m.body}</g>`));
}
// christmas collection (tall): kept last so earlier scenes keep their generated ids
{
  const bauble = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#fff" opacity=".55"/>`;
  const star = (cx, cy, r) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, d = i % 2 ? r * 0.45 : r;
      return `${(cx + Math.cos(a) * d).toFixed(1)},${(cy + Math.sin(a) * d).toFixed(1)}`;
    });
    return `<polygon points="${pts.join(" ")}" fill="#F0C24B"/>`;
  };
  const tree = (cx, base, height, width) => {
    const tiers = 4, tierH = height / tiers;
    let out = `<rect x="${cx - width * 0.06}" y="${base - 40}" width="${width * 0.12}" height="40" fill="#4A2C20"/>`;
    for (let i = 0; i < tiers; i++) {
      const top = base - 40 - height + i * tierH * 0.86, bottom = top + tierH * 1.45, half = (width / 2) * (0.5 + (i * 0.5) / (tiers - 1));
      out += `<path d="M${cx},${top} L${cx + half},${bottom} Q${cx},${bottom + 22} ${cx - half},${bottom} Z" fill="${i % 2 ? "#2F7A52" : "#266545"}"/>`;
    }
    const colors = ["#C8102E", "#F0C24B", "#F7F1E3", "#C8102E", "#F0C24B", "#F7F1E3", "#C8102E", "#F0C24B"];
    [[-0.12, 0.2], [0.13, 0.28], [-0.22, 0.43], [0.2, 0.47], [-0.05, 0.56], [-0.32, 0.72], [0.1, 0.74], [0.34, 0.76]].forEach(([dx, dy], i) => {
      out += bauble(cx + dx * width, base - 40 - height + dy * height * 1.02, 11, colors[i]);
    });
    return out + star(cx, base - 40 - height - 4, 30);
  };
  const garland = () => {
    let out = `<path d="M-20,70 Q225,190 450,70 Q675,190 920,70" fill="none" stroke="#2F7A52" stroke-width="22" stroke-linecap="round"/>`;
    out += `<path d="M-20,70 Q225,190 450,70 Q675,190 920,70" fill="none" stroke="#F0C24B" stroke-width="3" stroke-dasharray="2 34" stroke-linecap="round"/>`;
    [[225, 130, "#C8102E"], [675, 130, "#C8102E"]].forEach(([x, y, c]) => { out += bauble(x, y + 34, 22, c) + `<rect x="${x - 6}" y="${y + 4}" width="12" height="10" fill="#F0C24B"/>`; });
    return out;
  };
  const gift = (x, y, w, h, box, ribbon) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${box}"/><rect x="${x + w / 2 - 7}" y="${y}" width="14" height="${h}" fill="${ribbon}"/><rect x="${x}" y="${y + h * 0.36}" width="${w}" height="12" fill="${ribbon}"/>` +
    `<path d="M${x + w / 2},${y} q-26,-30 -36,-6 q4,14 36,6 q26,-30 36,-6 q-4,14 -36,6" fill="${ribbon}"/>`;
  scene("collection-christmas", 900, 1200, (w, h) => ({
    defs: backdrop("bg", "#1E4A36", "#0F2A20") + `<radialGradient id="glow"><stop offset="0" stop-color="#F7E2A8" stop-opacity=".55"/><stop offset="1" stop-color="#F7E2A8" stop-opacity="0"/></radialGradient>`,
    body: `<rect width="${w}" height="${h}" fill="url(#bg)"/>${arch(w * 0.5, h * 0.09, w * 0.68, h * 0.91, "#fff", 0.08)}<circle cx="450" cy="470" r="400" fill="url(#glow)"/>` +
      tree(150, 1150, 600, 260) + tree(762, 1150, 520, 250) + garland() + `<ellipse cx="450" cy="1150" rx="360" ry="24" fill="#000" opacity=".25"/>`,
  }), [{ spec: spec("christmas-gown-red", { pose: "hip" }), x: 450, y: 110, s: 0.88 }],
  gift(56, 1076, 92, 80, "#C8102E", "#F0C24B") + gift(136, 1102, 66, 54, "#F7F1E3", "#C8102E") + gift(706, 1090, 76, 66, "#F0C24B", "#C8102E") + gift(772, 1062, 74, 94, "#7A1020", "#F7F1E3") + snow(900, 1200, 70, 11));
}
console.log("site art: hero, hero-mobile, banner, story, tiles, collections, contact, track, not-found, placeholder, collection-christmas");
void GOLD;
