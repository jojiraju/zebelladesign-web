// Imports real photos from ./photos into the storefront.   npm run photos   |   npm run photos -- --list
import { existsSync, readdirSync } from "node:fs";
import { join, extname, basename } from "node:path";
import sharp from "sharp";
import { COLLECTION_DEFS, PRODUCT_SPECS } from "../src/lib/mock/specs.ts";
import { ROOT, loadManifest, saveManifest, slotPath } from "./lib/photos.mjs";

const EXT = [".jpg", ".jpeg", ".png", ".webp"];
const find = (dir, name) => {
  const d = join(ROOT, "photos", dir);
  if (!existsSync(d)) return null;
  const f = readdirSync(d).find((x) => EXT.includes(extname(x).toLowerCase()) && basename(x, extname(x)).toLowerCase() === name.toLowerCase());
  return f ? join(d, f) : null;
};

const slots = [
  ...COLLECTION_DEFS.map((c) => ({ key: `collection-${c.slug}`, src: find("collections", c.slug) })),
  ...PRODUCT_SPECS.flatMap((p) => [1, 2].map((n) => ({ key: `${p.slug}-${n}`, src: find("products", `${p.slug}-${n}`) }))),
];

if (process.argv.includes("--list")) {
  const m = loadManifest();
  for (const s of slots) console.log(`${s.key.padEnd(48)} ${s.src ? "photo in /photos" : m[s.key] ? "imported" : "-"}`);
  process.exit(0);
}

const manifest = loadManifest();
let n = 0;
for (const s of slots) {
  if (!s.src) continue;
  await sharp(s.src).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toFile(join(ROOT, "public", slotPath(s.key)));
  manifest[s.key] = "webp";
  n++;
  console.log("imported", s.key);
}
saveManifest(manifest);
console.log(n ? `\n${n} photo(s) imported.` : "\nNo photos found in /photos (see photos/README.md).");
