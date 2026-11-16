import { promises as fs } from "node:fs";
import path from "node:path";
import { byFileNumber } from "./file-order";

/** A ready-made advertisement image dropped into /public/ads (text, offer and button are part of the picture). */
export interface AdBanner { id: string; src: string; width: number; height: number; alt: string; href: string }

const DIR = path.join(process.cwd(), "public", "ads");
const EXT = /\.(png|jpe?g|webp)$/i;

/** Pixel size straight from the file header (PNG, JPEG, WebP) — no image library needed. */
function imageSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length > 24 && buf.toString("ascii", 1, 4) === "PNG") return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  }
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const t = buf.toString("ascii", 12, 16);
    if (t === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (t === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (t === "VP8L") { const b = buf.readUInt32LE(21); return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }; }
  }
  return null;
}

/** Images in /public/ads (sorted by file name: ad-1.png, ad-2.png, …). Empty when the folder has none. */
export async function getAdBanners(): Promise<AdBanner[]> {
  let files: string[] = [];
  try { files = (await fs.readdir(DIR)).filter((f) => EXT.test(f)).sort(byFileNumber); } catch { return []; }
  const out: AdBanner[] = [];
  for (const f of files.slice(0, 5)) {
    const size = imageSize(await fs.readFile(path.join(DIR, f)));
    if (size?.width && size.height) out.push({ id: f, src: `/ads/${f}`, ...size, alt: "Style More Spend Less offer — shop now", href: "/shop" });
  }
  return out;
}
