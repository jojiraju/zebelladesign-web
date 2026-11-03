// Generates photographic images for every demo COLLECTION and PRODUCT with an AI image API,
// in the style of a studio shoot: an Indian model, arched alcove wall, soft window light.
//
//   npm run images:catalog -- --list                          # show slots, no API call
//   npm run images:catalog -- --only christmas-velvet-frock-red,collection-frocks    # try a few first
//   npm run images:catalog                                    # everything that is missing (54 images)
//   npm run images:catalog -- --force                         # regenerate existing ones
//
// Needs OPENAI_API_KEY in .env.local (never commit it). Optional: IMAGE_MODEL (default gpt-image-1),
// IMAGE_QUALITY (low | medium | high; default medium). Each image is one paid API call — try --only first.
// Output: public/products/<slug>-1.webp (full length), <slug>-2.webp (detail), public/art/collection-<slug>.webp.
// The slots are registered in src/lib/mock/photos.json so the storefront switches from the SVG art automatically.
// NOTE: AI images of the "same" dress will vary slightly between views; for exact product photos use `npm run photos`.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { COLLECTION_DEFS, COLORS, PRODUCT_SPECS } from "../src/lib/mock/specs.ts";
import { ROOT, loadManifest, saveManifest, slotPath } from "./lib/photos.mjs";

const PORTRAIT = "1024x1536";
const STYLE =
  "Premium editorial fashion photograph for an Indian women's ethnic and contemporary wear brand. A beautiful Indian woman in her twenties with dark hair in a loose low bun with soft curls, small gold drop earrings, natural makeup. " +
  "Soft dappled window light, shallow depth of field, realistic fabric texture and skin, magazine quality. No text, no logos, no watermarks. ";

const SIL = {
  anarkali: "a floor-length anarkali dress with a fitted bodice, short sleeves and a full flared skirt",
  frock: "a knee-length fit-and-flare frock with puff sleeves, a fitted bodice and a full skirt",
  salwar: "a straight kurta with salwar trousers and a matching dupatta",
  cordset: "a coordinated cropped top and wide-leg trousers set",
  gown: "an elegant floor-length gown with a fitted bodice and a flowing skirt",
};
const PATTERN = {
  plain: "solid fabric with a subtle tonal texture and gold trim",
  dots: "fine polka-dot weave with gold detailing",
  floral: "delicate floral embroidery in gold thread",
  stripes: "fine vertical stripes with gold border trim",
};
const BACKDROP = { red: "deep forest green", leaf: "warm cream", maroon: "warm beige", royal: "soft ivory", olive: "cream", black: "dusty rose", blush: "sage green", mustard: "deep teal", teal: "warm ivory", wine: "blush pink", ivory: "terracotta", rose: "soft sage", navy: "warm sand", mint: "blush pink" };

/** key -> { size, prompt } */
const slots = {};
for (const c of COLLECTION_DEFS) {
  const scene = {
    "christmas-collection": "wearing a rich red velvet-look festive dress with gold embroidery, in front of a deep forest-green arched alcove wall, holding the skirt, looking down gently",
    "top-bottom-sets": "wearing a coordinated blush-pink crop top and wide-leg trousers set, in front of a soft cream arched alcove wall, hand on hip",
    frocks: "wearing a flowing pastel fit-and-flare frock with puff sleeves, twirling softly, in front of a pale sage arched alcove wall",
    "salwar-sets": "wearing a teal chanderi kurta with salwar and a light dupatta, in front of a warm ivory arched alcove wall",
    "festive-wear": "wearing a maroon embroidered anarkali with a gold border, in front of a warm beige arched alcove wall",
    "signature-collection": "wearing a wine-coloured satin gown with a deep V-neck, in front of a blush-pink arched alcove wall",
  }[c.slug];
  slots[`collection-${c.slug}`] = { size: PORTRAIT, prompt: `${STYLE}Three-quarter length photo of the woman ${scene}.` };
}
for (const p of PRODUCT_SPECS) {
  const col = COLORS[p.colors[0]].name.toLowerCase();
  const wear = `${col} ${SIL[p.sil]}, ${PATTERN[p.pattern]}, made of ${p.fabric.toLowerCase()}`;
  const bg = BACKDROP[p.colors[0]] ?? "soft cream";
  slots[`${p.slug}-1`] = { size: PORTRAIT, prompt: `${STYLE}Full-length photo of the woman wearing ${wear}. She stands in front of an arched alcove wall in ${bg}, holding the skirt gently, looking down. The garment is the clear focus.` };
  slots[`${p.slug}-2`] = { size: PORTRAIT, prompt: `${STYLE}Close-up waist-up detail photo of the woman wearing ${wear}, showing the neckline, sleeves and fabric texture clearly, in front of an arched alcove wall in ${bg}.` };
}

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const only = (() => { const i = args.indexOf("--only"); return i >= 0 ? args[i + 1].split(",").map((s) => s.trim()) : null; })();
const manifest = loadManifest();
const outFile = (key) => join(ROOT, "public", slotPath(key));
const want = Object.keys(slots).filter((k) => !only || only.some((o) => k === o || k.startsWith(`${o}-`)));

if (flag("list")) {
  for (const k of want) console.log(`${k.padEnd(48)} ${existsSync(outFile(k)) ? "exists" : "missing"}`);
  console.log(`\n${want.length} slots (${want.filter((k) => !existsSync(outFile(k))).length} missing)`);
  process.exit(0);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) { console.error("OPENAI_API_KEY is not set. Add it to .env.local, then run:\n  npm run images:catalog -- --only christmas-velvet-frock-red-1"); process.exit(1); }
const MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
const QUALITY = process.env.IMAGE_QUALITY || "medium";

async function generate(key, { size, prompt }) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, prompt, size, quality: QUALITY, n: 1, output_format: "webp", output_compression: 85 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("API returned no image data");
  mkdirSync(dirname(outFile(key)), { recursive: true });
  writeFileSync(outFile(key), Buffer.from(b64, "base64"));
}

let ok = 0; const failed = [];
for (const k of want) {
  if (!flag("force") && existsSync(outFile(k))) { manifest[k] = "webp"; continue; }
  try { process.stdout.write(`generating ${k} ... `); await generate(k, slots[k]); manifest[k] = "webp"; ok++; console.log("ok"); saveManifest(manifest); }
  catch (e) { failed.push(k); console.log("FAILED:", e.message); }
}
saveManifest(manifest);
console.log(`\n${ok} generated, ${failed.length} failed${failed.length ? ` (${failed.join(", ")}) — re-run to retry` : ""}.`);
process.exit(failed.length ? 1 : 0);
