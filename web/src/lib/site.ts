/** Canonical site origin (no trailing slash). Falls back to localhost for development. */
export const siteUrl = (): string => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const abs = (path: string) => `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
