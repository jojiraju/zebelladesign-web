// Shared helpers: the manifest of slots that have a real/AI photo (src/lib/mock/photos.json).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FILE = join(ROOT, "src", "lib", "mock", "photos.json");

export const loadManifest = () => { try { return JSON.parse(readFileSync(FILE, "utf8")); } catch { return {}; } };
export const saveManifest = (m) => writeFileSync(FILE, JSON.stringify(Object.fromEntries(Object.entries(m).sort()), null, 2) + "\n");

/** Slot key -> output file (relative to public/) */
export const slotPath = (key) => (key.startsWith("collection-") ? `art/${key}.webp` : `products/${key}.webp`);
