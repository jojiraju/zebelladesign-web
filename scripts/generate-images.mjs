// Generates the storefront's photographic imagery with an AI image API and wires it into the code.
//
//   node --env-file=.env.local scripts/generate-images.mjs                # generate every missing image
//   node --env-file=.env.local scripts/generate-images.mjs --only hero    # one image (or comma list)
//   node --env-file=.env.local scripts/generate-images.mjs --force        # regenerate even if the file exists
//   node scripts/generate-images.mjs --dummy                             # free sample photos (picsum.photos), no key needed
//   node scripts/generate-images.mjs --list                               # show the slots, no API call
//
// Needs OPENAI_API_KEY in .env.local (never commit it). Optional:
//   IMAGE_MODEL   (default gpt-image-1)   IMAGE_QUALITY (low | medium | high, default medium)
//
// Output goes to public/art/<name>.webp. After each successful image, references to
// /art/<name>.svg in src/ are rewritten to /art/<name>.webp, so pages switch over automatically.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "art");
mkdirSync(OUT, { recursive: true });

const LANDSCAPE = "1536x1024";
const PORTRAIT = "1024x1536";

const STYLE =
  "Editorial fashion photography for an Indian women's ethnic and contemporary wear boutique called Zebella Designs. " +
  "Soft natural light, refined and elegant, shallow depth of field, premium magazine quality, realistic fabric texture. " +
  "Colour story: dusty rose, blush, ivory and warm gold accents. No text, no logos, no watermarks, no captions. ";

/** name -> { size, prompt }. Names match the existing /art/<name>.svg files so references swap over 1:1. */
const SLOTS = {
  hero: { size: LANDSCAPE, prompt: "Wide hero image: an elegant woman in a flowing rose-pink embroidered anarkali dress standing in a sunlit ivory-toned room with arched windows, full length, space on the left side for headline text, serene mood." },
  "hero-mobile": { size: PORTRAIT, prompt: "Vertical hero image: an elegant woman in a flowing rose-pink embroidered anarkali dress, full length, soft ivory studio background with warm window light, space at the top for headline text." },
  banner: { size: LANDSCAPE, prompt: "Wide promotional banner: two women in coordinated festive outfits (a blush lehenga and an ivory-gold salwar set) laughing together in a softly lit boutique, negative space on one side." },
  story: { size: PORTRAIT, prompt: "Behind-the-scenes brand story image: a designer's hands draping rose-pink silk fabric over a mannequin in a bright atelier, sketches and thread spools on the table, intimate and warm." },
  "tile-new": { size: PORTRAIT, prompt: "A model in a fresh pastel-pink contemporary kurta set with delicate embroidery, standing against a clean ivory backdrop, full length, 'new arrivals' feel." },
  "tile-festive": { size: PORTRAIT, prompt: "A model in a rich festive rose-and-gold lehenga with heavy embroidery and dupatta, celebratory but elegant, warm glowing light, full length." },
  "tile-ethnic": { size: PORTRAIT, prompt: "A model in a designer ethnic anarkali suit in deep maroon with gold zari work, classic Indian palace corridor background, full length." },
  "tile-signature": { size: PORTRAIT, prompt: "A model in a signature statement gown-style ethnic dress in ivory with rose-gold embroidery, dramatic yet soft studio lighting, full length." },
  "tile-best": { size: PORTRAIT, prompt: "A model in a best-selling flowy rose-pink co-ord set (kurta, palazzo, dupatta), natural pose, bright airy studio, full length." },
  "collection-1": { size: PORTRAIT, prompt: "Close, tasteful flat-lay of folded blush and ivory ethnic fabrics with embroidery details and a gold bangle, soft top light." },
  "collection-2": { size: PORTRAIT, prompt: "A model seen from behind in an embroidered rose-pink dupatta and suit, walking through a sunlit courtyard, full length." },
  "collection-3": { size: PORTRAIT, prompt: "A model in a pastel mint and ivory salwar set, seated on a cane chair in a bright minimal studio, full length." },
  "collection-4": { size: PORTRAIT, prompt: "A model in a deep rose velvet festive kurta set with gold jewellery, moody warm evening light, full length." },
  auth: { size: PORTRAIT, prompt: "Calm, welcoming portrait of a woman in a soft rose-pink kurta holding a shopping bag near a sunlit window, ivory interior, lots of soft negative space, suitable as a login page side image." },
  contact: { size: LANDSCAPE, prompt: "A friendly boutique counter with a vase of pale roses, fabric swatches, a notebook and a phone, soft daylight, inviting and warm, no people." },
  track: { size: LANDSCAPE, prompt: "A neatly packed ivory gift box tied with a rose-pink ribbon beside folded embroidered garment and tissue paper on a pale table, soft daylight, no people." },
  "not-found": { size: LANDSCAPE, prompt: "An empty elegant clothes rail with a single rose-pink dress on a wooden hanger in a bright ivory boutique, lots of empty space, whimsical and calm, no people." },
  placeholder: { size: PORTRAIT, prompt: "A single rose-pink embroidered dress on a wooden hanger against a plain soft ivory wall, centred, product placeholder look, even lighting, no people." },
};

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const value = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };

if (flag("list")) {
  for (const [n, s] of Object.entries(SLOTS)) console.log(`${n.padEnd(16)} ${s.size}  ${existsSync(join(OUT, `${n}.webp`)) ? "exists" : "missing"}`);
  process.exit(0);
}

const dummy = flag("dummy");
const key = process.env.OPENAI_API_KEY;
if (!dummy && !key) {
  console.error("OPENAI_API_KEY is not set. Put it in .env.local and run:\n  node --env-file=.env.local scripts/generate-images.mjs");
  process.exit(1);
}
const MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
const QUALITY = process.env.IMAGE_QUALITY || "medium";
const only = value("only")?.split(",").map((s) => s.trim());

/** Dummy mode: deterministic sample photo per slot (random stock imagery, NOT fashion shots). */
async function fetchDummy(name, { size }) {
  const [w, h] = size.split("x");
  const res = await fetch(`https://picsum.photos/seed/zebella-${name}/${w}/${h}.webp`, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(join(OUT, `${name}.webp`), Buffer.from(await res.arrayBuffer()));
}

async function generate(name, { size, prompt }) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, prompt: STYLE + prompt, size, quality: QUALITY, n: 1, output_format: "webp", output_compression: 85 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("API returned no image data");
  writeFileSync(join(OUT, `${name}.webp`), Buffer.from(b64, "base64"));
}

/** Rewrite /art/<name>.svg -> /art/<name>.webp across src/ so pages use the new photo. */
function rewriteReferences(names) {
  const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [".ts", ".tsx"].includes(extname(p)) ? [p] : [];
  });
  for (const file of walk(join(ROOT, "src"))) {
    let s = readFileSync(file, "utf8"), changed = false;
    for (const n of names) {
      const from = `/art/${n}.svg`;
      if (s.includes(from)) { s = s.split(from).join(`/art/${n}.webp`); changed = true; }
    }
    if (changed) writeFileSync(file, s);
  }
}

const done = [], failed = [];
for (const [name, slot] of Object.entries(SLOTS)) {
  if (only && !only.includes(name)) continue;
  if (!flag("force") && existsSync(join(OUT, `${name}.webp`))) { done.push(name); console.log("skip (exists)", name); continue; }
  try {
    process.stdout.write(`generating ${name} ... `);
    await (dummy ? fetchDummy(name, slot) : generate(name, slot));
    done.push(name);
    console.log("ok");
  } catch (e) {
    failed.push(name);
    console.log("FAILED:", e.message);
  }
}
rewriteReferences(done);
console.log(`\n${done.length} ready, ${failed.length} failed${failed.length ? ` (${failed.join(", ")}) — re-run to retry` : ""}.`);
process.exit(failed.length ? 1 : 0);
