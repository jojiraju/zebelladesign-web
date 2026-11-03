// Generates the static brand artwork in public/art (no external services, no binary assets).
// Run: node scripts/generate-art.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "art");
mkdirSync(OUT, { recursive: true });

const C = { ivory: "#FDF8F6", cream: "#F6E9E7", blush: "#F8E3E6", rose: "#B96E7C", roseDeep: "#7E4452", roseSoft: "#E3B5BF", taupe: "#A8969A", line: "#E3CFCE" };

// Small seeded PRNG so output is reproducible.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

const defs = (id, stops) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;

/** Layered soft waves, same visual language as the existing hero/tile art. */
function waves(w, h, seed, palette) {
  const r = rng(seed);
  const n = palette.length;
  let out = "";
  palette.forEach(([a, b], i) => {
    const y = h * (0.18 + (i / n) * 0.62);
    const amp = h * (0.06 + r() * 0.07);
    const y1 = y - amp * (0.5 + r()), y2 = y + amp * (0.5 + r()), y3 = y - amp * r();
    out += `<path d="M-90,${y.toFixed(0)} C${w * 0.25},${y1.toFixed(0)} ${w * 0.45},${y2.toFixed(0)} ${w * 0.62},${y3.toFixed(0)} S${w * 0.95},${(y2 - amp).toFixed(0)} ${w + 90},${(y + amp).toFixed(0)} L${w + 90},${h + 90} L-90,${h + 90} Z" fill="url(#w${i})" opacity="${(0.6 + r() * 0.3).toFixed(2)}"/>`;
  });
  const grads = palette.map(([a, b], i) => defs(`w${i}`, [[0, a], [1, b]])).join("");
  return { grads, body: out };
}

const noise = `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter>`;

// Stylised dress on a hanger, drawn in a 900x1200 box (centred).
const dress = (fill, stroke, strokeOpacity = 1, fillOpacity = 1) =>
  `<g transform="translate(0,0)">
    <path d="M450,215 v-30 q0,-26 24,-26 q20,0 20,18" fill="none" stroke="${stroke}" stroke-opacity="${strokeOpacity}" stroke-width="5" stroke-linecap="round"/>
    <path d="M450,215 L250,330 Q450,300 650,330 Z" fill="none" stroke="${stroke}" stroke-opacity="${strokeOpacity}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M405,330 Q450,385 495,330 L515,520 C530,640 660,880 715,1050 Q450,1110 185,1050 C240,880 370,640 385,520 Z" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-opacity="${strokeOpacity}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M385,520 Q450,545 515,520" fill="none" stroke="${stroke}" stroke-opacity="${strokeOpacity}" stroke-width="4"/>
  </g>`;

function svg(w, h, defsStr, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs>${defsStr}${noise}</defs>${body}<rect width="${w}" height="${h}" filter="url(#n)"/></svg>\n`;
}

function write(name, content) {
  writeFileSync(join(OUT, name), content);
  console.log("wrote", name);
}

// 1. Sign-in / register / forgot-password side panel (portrait)
{
  const w = 900, h = 1200;
  const { grads, body } = waves(w, h, 11, [[C.blush, C.cream], [C.roseSoft, C.rose], [C.rose, C.roseDeep]]);
  write("auth.svg", svg(w, h, defs("bg", [[0, C.ivory], [1, C.cream]]) + grads,
    `<rect width="${w}" height="${h}" fill="url(#bg)"/>${body}${dress(C.ivory, C.ivory, 0.95, 0.12)}`));
}

// 2. Product image placeholder (3:4) — used whenever a product/line has no photo yet
{
  const w = 900, h = 1200;
  write("placeholder.svg", svg(w, h, defs("bg", [[0, C.cream], [1, C.ivory]]),
    `<rect width="${w}" height="${h}" fill="url(#bg)"/><circle cx="450" cy="640" r="330" fill="${C.blush}" opacity=".7"/>${dress(C.ivory, C.taupe, 0.7, 0.9)}`));
}

// 3. Wide page banners (contact, track order, 404)
function wide(name, seed, pal, motif) {
  const w = 1200, h = 800;
  const { grads, body } = waves(w, h, seed, pal);
  write(name, svg(w, h, defs("bg", [[0, C.ivory], [1, C.blush]]) + grads, `<rect width="${w}" height="${h}" fill="url(#bg)"/>${body}${motif}`));
}
const ring = (cx, cy, r, op = 0.55) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ivory}" stroke-opacity="${op}" stroke-width="3"/>`;
wide("contact.svg", 21, [[C.cream, C.line], [C.roseSoft, C.rose], [C.rose, C.roseDeep]],
  // envelope
  `<g fill="none" stroke="${C.ivory}" stroke-width="5" stroke-linejoin="round" stroke-opacity=".9"><rect x="430" y="270" width="340" height="230" rx="10"/><path d="M430,285 L600,415 L770,285"/></g>${ring(600, 385, 260)}${ring(600, 385, 330, 0.3)}`);
wide("track.svg", 31, [[C.cream, C.line], [C.roseSoft, C.rose], [C.rose, C.roseDeep]],
  // parcel
  `<g fill="none" stroke="${C.ivory}" stroke-width="5" stroke-linejoin="round" stroke-opacity=".9"><path d="M600,270 L760,340 V500 L600,570 L440,500 V340 Z"/><path d="M440,340 L600,410 L760,340 M600,410 V570"/></g>${ring(600, 420, 270)}${ring(600, 420, 340, 0.3)}`);
wide("not-found.svg", 41, [[C.blush, C.cream], [C.roseSoft, C.rose], [C.rose, C.roseDeep]],
  `<g transform="translate(600,0) scale(.62) translate(-450,60)">${dress(C.ivory, C.ivory, 0.9, 0.12)}</g>`);

// 4. Fallback artwork for collections / categories that have no image of their own.
//    (Portrait 3:4 — rotate through the palette so adjacent cards differ.)
const sets = [
  [[C.cream, C.line], [C.roseSoft, C.rose], [C.rose, C.roseDeep]],
  [[C.blush, C.roseSoft], [C.rose, C.roseDeep], [C.taupe, C.roseDeep]],
  [[C.ivory, C.cream], [C.line, C.taupe], [C.rose, C.roseDeep]],
  [[C.roseSoft, C.rose], [C.cream, C.line], [C.roseDeep, "#3a1f27"]],
];
sets.forEach((pal, i) => {
  const w = 900, h = 1200;
  const { grads, body } = waves(w, h, 51 + i * 7, pal);
  write(`collection-${i + 1}.svg`, svg(w, h, defs("bg", [[0, C.ivory], [1, C.cream]]) + grads, `<rect width="${w}" height="${h}" fill="url(#bg)"/>${body}`));
});
