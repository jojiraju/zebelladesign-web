/**
 * "Fly to bag / wishlist": a small copy of the product photo arcs from where you clicked to the matching icon,
 * shrinks into it, and the icon bounces. Pure Web Animations API (no library, no React state); a no-op on the server,
 * and under prefers-reduced-motion only the icon bounce plays.
 *
 * Targets are any elements marked `data-fly-target="cart" | "wishlist"`; the first one that is actually visible wins
 * (header icons first, then the bottom / side bars), so it works at every screen size.
 */
export type FlyKind = "cart" | "wishlist";

const visible = (el: Element) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && r.bottom > 0 && r.top < innerHeight; };

/** The photo frame to fly from: the last visible `[data-fly-source]` (a quick-view dialog is later in the DOM than the page behind it). */
export function flySource(root?: ParentNode | null): Element | null {
  const list = [...(root ?? document).querySelectorAll("[data-fly-source]")].filter(visible);
  return list[list.length - 1] ?? null;
}

function bump(el: Element) {
  el.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.38) rotate(-8deg)", offset: 0.35 }, { transform: "scale(0.9) rotate(4deg)", offset: 0.65 }, { transform: "scale(1)" }],
    { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" },
  );
  // a soft ring that expands from the icon
  const r = el.getBoundingClientRect();
  const ring = document.createElement("div");
  Object.assign(ring.style, { position: "fixed", left: `${r.left + r.width / 2 - 18}px`, top: `${r.top + r.height / 2 - 18}px`, width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #b96e7c", pointerEvents: "none", zIndex: "9998" });
  document.body.appendChild(ring);
  ring.animate([{ transform: "scale(.6)", opacity: 0.9 }, { transform: "scale(2.1)", opacity: 0 }], { duration: 620, easing: "ease-out" }).onfinish = () => ring.remove();
}

export function flyTo(kind: FlyKind, from: Element | null | undefined, image?: string | null) {
  if (typeof document === "undefined") return;
  const target = [...document.querySelectorAll(`[data-fly-target="${kind}"]`)].find(visible);
  if (!target) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const src = from && visible(from) ? from.getBoundingClientRect() : null;
  const picture = image ?? (from?.querySelector("img") as HTMLImageElement | null)?.currentSrc;
  if (reduce || !src || !picture) { bump(target); return; }

  const w = Math.min(96, Math.max(56, src.width * 0.4)), h = w * 1.3;
  const t = target.getBoundingClientRect();
  const x0 = src.left + src.width / 2, y0 = src.top + src.height / 2;
  const x2 = t.left + t.width / 2, y2 = t.top + t.height / 2;
  const x1 = (x0 + x2) / 2, y1 = Math.min(y0, y2) - Math.max(90, Math.abs(x2 - x0) * 0.25); // control point: lifts the path into an arc

  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed", left: "0", top: "0", width: `${w}px`, height: `${h}px`, zIndex: "9999", pointerEvents: "none",
    borderRadius: "14px", overflow: "hidden", boxShadow: "0 18px 40px -12px rgba(35,26,29,.55)", border: "2px solid #fff", background: "#f4dde2", willChange: "transform, opacity",
  });
  const img = document.createElement("img");
  img.src = picture; img.alt = "";
  Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" });
  el.appendChild(img);
  document.body.appendChild(el);

  const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const frames: Keyframe[] = [];
  const N = 30;
  for (let i = 0; i <= N; i++) {
    const p = i / N, e = ease(p), q = 1 - e;
    const x = q * q * x0 + 2 * q * e * x1 + e * e * x2;
    const y = q * q * y0 + 2 * q * e * y1 + e * e * y2;
    const s = 1 - 0.84 * e;
    frames.push({ transform: `translate(${x - w / 2}px, ${y - h / 2}px) scale(${s}) rotate(${e * 14}deg)`, opacity: p > 0.88 ? 1 - (p - 0.88) / 0.12 * 0.5 : 1, offset: p });
  }
  const anim = el.animate(frames, { duration: 900, fill: "forwards" });
  anim.onfinish = () => { el.remove(); bump(target); };
  anim.oncancel = () => el.remove();
}
