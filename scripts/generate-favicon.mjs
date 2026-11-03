// Generates the favicon set from the ZB monogram (public/brand/logo-mark.png + the traced outlines in
// src/components/home/zb-shapes.json).
//   node scripts/generate-favicon.mjs  ->  src/app/icon.svg, icon.png (512), apple-icon.png (180), favicon.ico (16/32/48)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "src", "app");
const BG = "#FDF8F6", ROSE = "#B96E7C";

// ---- Crisp vector version from the traced outlines (so the SVG icon stays sharp at any size) ----
const logo = JSON.parse(readFileSync(join(APP, "..", "components", "home", "zb-shapes.json"), "utf8"));
const path = (pts, k, ox, oy) => "M" + pts.map(([x, y]) => `${(ox + x * k).toFixed(1)} ${(oy - y * k).toFixed(1)}`).join("L") + "Z";
function svg(size, pad, radius) {
  const k = (size * (1 - 2 * pad)) / Math.max(logo.width, logo.height);
  const d = logo.shapes.map((s) => [s.outline, ...s.holes].map((p) => path(p, k, size / 2, size / 2)).join("")).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/><path d="${d}" fill="${ROSE}" fill-rule="evenodd"/></svg>\n`;
}

writeFileSync(join(APP, "icon.svg"), svg(512, 0.14, 112));

// ---- PNG/ICO rendered from the original logo bitmap (exact brand artwork) ----
const mark = await sharp(join(ROOT, "public", "brand", "logo-mark.png")).trim().toBuffer();
async function tile(size, pad, radius) {
  const inner = Math.round(size * (1 - 2 * pad));
  const m = await sharp(mark).resize(inner, inner, { fit: "inside" }).toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}"/></svg>`);
  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: m, gravity: "center" }, { input: mask, blend: "dest-in" }]).png().toBuffer();
}

writeFileSync(join(APP, "icon.png"), await tile(512, 0.14, 112));
writeFileSync(join(APP, "apple-icon.png"), await tile(180, 0.16, 0)); // iOS applies its own rounding

// favicon.ico (16/32/48): tighter padding so the monogram stays readable when tiny
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map((n) => tile(n, n === 16 ? 0.06 : 0.1, Math.round(n * 0.22))));
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(frames.length, 4);
let offset = 6 + 16 * frames.length;
const dir = frames.map((f, i) => { const e = Buffer.alloc(16); e[0] = sizes[i]; e[1] = sizes[i]; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(f.length, 8); e.writeUInt32LE(offset, 12); offset += f.length; return e; });
writeFileSync(join(APP, "favicon.ico"), Buffer.concat([head, ...dir, ...frames]));
console.log("favicon set written from the ZB logo: icon.svg, icon.png, apple-icon.png, favicon.ico");
