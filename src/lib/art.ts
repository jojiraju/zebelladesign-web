/** Static brand artwork in /public/art (regenerate with `node scripts/generate-art.mjs`). */
export const ART = {
  auth: "/art/auth.svg",
  contact: "/art/contact.svg",
  track: "/art/track.svg",
  notFound: "/art/not-found.svg",
  productPlaceholder: "/art/placeholder.svg",
} as const;

const COLLECTION_ART = ["/art/tile-new.svg", "/art/tile-festive.svg", "/art/tile-ethnic.svg", "/art/tile-signature.svg", "/art/tile-best.svg", "/art/collection-1.svg", "/art/collection-2.svg", "/art/collection-3.svg", "/art/collection-4.svg"];

/** Image for a collection/category: its own, else a stable brand fallback chosen by position. */
export const collectionArt = (imageUrl: string | undefined, index: number): string =>
  imageUrl || COLLECTION_ART[((index % COLLECTION_ART.length) + COLLECTION_ART.length) % COLLECTION_ART.length];
