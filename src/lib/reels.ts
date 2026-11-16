import { promises as fs } from "node:fs";
import path from "node:path";
import type { Product } from "./types";
import { byFileNumber } from "./file-order";

const DIR = path.join(process.cwd(), "public", "reels");
const VIDEO = /\.(mp4|webm|mov)$/i;

/**
 * Reel list for the home strip and /shop-from-reels.
 *  1. Video files dropped into /public/reels — a file named after a product slug (e.g. `panel-anarkali.mp4`) plays on that product;
 *     any other file is given the next product that has no reel yet.
 *  2. Products that already have their own `videoUrl`.
 *  3. Everything else as photo reels (so the section is never empty).
 */
export async function getReelProducts(products: Product[]): Promise<Product[]> {
  let files: string[] = [];
  try { files = (await fs.readdir(DIR)).filter((f) => VIDEO.test(f)).sort(byFileNumber); } catch { /* no folder yet */ }

  const used = new Set<string>();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const fromFiles: Product[] = [];
  const unmatched: string[] = [];

  for (const f of files) {
    const p = bySlug.get(f.replace(VIDEO, "").toLowerCase());
    if (p && !used.has(p.id)) { used.add(p.id); fromFiles.push({ ...p, videoUrl: `/reels/${f}` }); } else unmatched.push(f);
  }
  for (const f of unmatched) {
    const p = products.find((x) => !used.has(x.id));
    if (!p) break;
    used.add(p.id);
    fromFiles.push({ ...p, videoUrl: `/reels/${f}` });
  }

  const rest = products.filter((p) => !used.has(p.id));
  return [...fromFiles, ...rest.filter((p) => p.videoUrl), ...rest.filter((p) => !p.videoUrl)];
}
