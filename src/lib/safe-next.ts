const PROBE_ORIGIN = "https://store.invalid";

/**
 * Only allow same-site relative redirects (prevents open-redirect abuse via ?next=).
 * Parses the value the way a browser would, because `/\evil.com` and `/<tab>/evil.com` both resolve to another host.
 */
export function safeNext(next: string | null, fallback = "/account"): string {
  if (!next?.startsWith("/")) return fallback;
  try {
    const url = new URL(next, PROBE_ORIGIN);
    return url.origin === PROBE_ORIGIN ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
