// Generates the procedural placeholder artwork in web/public/art.
// These are original, locally-hosted SVGs so the storefront never depends on external image URLs.
// Replace them from the CMS (hero, banners, collections) and by uploading real product photography.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "web", "public", "art");
mkdirSync(out, { recursive: true });

// Seeded PRNG so output is stable between runs.
const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const grain = (id) =>
  `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter>`;

function ribbons({ w, h, palette, bg, seed, count = 7 }) {
  const r = rng(seed);
  let paths = "";
  for (let i = 0; i < count; i++) {
    const c = palette[i % palette.length];
    const y = h * (0.1 + (i / count) * 0.9);
    const amp = h * (0.08 + r() * 0.16);
    const x0 = -w * 0.1, x1 = w * 1.1;
    const d = `M${x0},${y} C${w * 0.25},${y - amp * 2} ${w * 0.45},${y + amp * 2.2} ${w * 0.62},${y + amp * 0.3} S${w * 0.95},${y - amp * 1.6} ${x1},${y + amp} L${x1},${h * 1.2} L${x0},${h * 1.2} Z`;
    paths += `<path d="${d}" fill="url(#g${i})" opacity="${0.55 + r() * 0.4}"/>`;
  }
  const defs = palette
    .concat(palette)
    .slice(0, count)
    .map((c, i) => `<linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs>${defs}${grain("n")}</defs><rect width="${w}" height="${h}" fill="${bg}"/>${paths}<rect width="${w}" height="${h}" filter="url(#n)"/></svg>`;
}

const gold = ["#E3B5BF", "#B96E7C"], deepGold = ["#B96E7C", "#7E4452"], cream = ["#F6E9E7", "#E3CFCE"],
  esp = ["#3D2B31", "#231A1D"], taupe = ["#D4C0C3", "#A8969A"], rose = ["#EDC6CD", "#C98693"],
  sage = ["#C9B6C4", "#8E7088"], wine = ["#7A3B45", "#4A1F29"], navy = ["#3B4A63", "#222C3F"];

const art = {
  hero: ribbons({ w: 1920, h: 1080, bg: "#231A1D", palette: [esp, deepGold, gold, taupe, deepGold, cream, gold], seed: 11 }),
  "hero-mobile": ribbons({ w: 900, h: 1400, bg: "#231A1D", palette: [esp, deepGold, gold, taupe, deepGold, cream, gold], seed: 17 }),
  "tile-new": ribbons({ w: 900, h: 1200, bg: "#FDF8F6", palette: [cream, gold, taupe, cream, deepGold], seed: 21, count: 5 }),
  "tile-festive": ribbons({ w: 900, h: 1200, bg: "#4A1F29", palette: [wine, rose, gold, wine, deepGold], seed: 31, count: 6 }),
  "tile-ethnic": ribbons({ w: 900, h: 1200, bg: "#F6E9E7", palette: [sage, cream, taupe, sage, gold], seed: 41, count: 6 }),
  "tile-signature": ribbons({ w: 900, h: 1200, bg: "#231A1D", palette: [esp, gold, deepGold, esp, gold], seed: 51, count: 6 }),
  "tile-best": ribbons({ w: 900, h: 1200, bg: "#FDF8F6", palette: [rose, cream, gold, rose, taupe], seed: 61, count: 5 }),
  story: ribbons({ w: 1000, h: 1250, bg: "#F6E9E7", palette: [taupe, gold, cream, deepGold, taupe], seed: 71, count: 6 }),
  banner: ribbons({ w: 1920, h: 700, bg: "#F6E9E7", palette: [cream, gold, taupe, deepGold, cream], seed: 81, count: 6 }),
};

// Demo product "photography": a garment silhouette on a tinted ground + a fabric close-up. Clearly labelled demo.
const garments = [
  ["Ivory", "#F6E9E7", "#FDF8F6"], ["Wine", "#7A3B45", "#4A1F29"], ["Sage", "#9AA58A", "#6E7A5E"],
  ["Rose", "#C9918A", "#A9786E"], ["Navy", "#3B4A63", "#222C3F"], ["Blush", "#E8B9C2", "#B96E7C"],
];
garments.forEach(([name, a, b], i) => {
  const sil = `M450,170 C420,170 400,190 400,215 L330,300 L270,640 L330,650 L360,420 L330,1020 L440,1030 L450,640 L460,1030 L570,1020 L540,420 L570,650 L630,640 L570,300 L500,215 C500,190 480,170 450,170 Z`;
  const front = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBEFEF"/><stop offset="1" stop-color="#EBD3D5"/></linearGradient><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>${grain("n")}</defs><rect width="900" height="1200" fill="url(#bg)"/><ellipse cx="450" cy="1085" rx="230" ry="26" fill="#231A1D" opacity=".12"/><path d="${sil}" fill="url(#f)"/><path d="M450,215 L450,640" stroke="${b}" stroke-opacity=".35" stroke-width="3"/><path d="M400,215 Q450,262 500,215" fill="none" stroke="#B96E7C" stroke-width="4"/><rect width="900" height="1200" filter="url(#n)"/><text x="36" y="1160" font-family="sans-serif" font-size="22" letter-spacing="4" fill="#231A1D" opacity=".45">DEMO IMAGE · ${name.toUpperCase()}</text></svg>`;
  const rr = rng(100 + i);
  let lines = "";
  for (let k = 0; k < 26; k++) lines += `<path d="M${-50},${k * 50} Q${450},${k * 50 + 40 * (rr() - 0.5) * 3} ${950},${k * 50 + 20}" stroke="${k % 4 === 0 ? "#B96E7C" : b}" stroke-opacity="${k % 4 === 0 ? 0.7 : 0.25}" stroke-width="${k % 4 === 0 ? 3 : 2}" fill="none"/>`;
  const detail = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>${grain("n")}</defs><rect width="900" height="1200" fill="url(#f)"/>${lines}<rect width="900" height="1200" filter="url(#n)"/><text x="36" y="1160" font-family="sans-serif" font-size="22" letter-spacing="4" fill="#fff" opacity=".6">DEMO IMAGE · FABRIC DETAIL</text></svg>`;
  art[`product-${i + 1}-a`] = front;
  art[`product-${i + 1}-b`] = detail;
});

for (const [name, svg] of Object.entries(art)) writeFileSync(join(out, `${name}.svg`), svg);
console.log(`Wrote ${Object.keys(art).length} SVGs to ${out}`);
