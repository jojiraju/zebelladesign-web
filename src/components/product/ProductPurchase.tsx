"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Loader2, Minus, Plus, Truck } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { MAX_QTY_PER_LINE, availableUnits, needsColor, needsSize, resolveVariant } from "@/lib/commerce/catalog-rules";
import type { Product } from "@/lib/types";

/** Variant picker + quantity + Add to Bag / Buy Now. Used on the product page and in Quick View. */
export function ProductPurchase({ product, sizeGuide, deliveryNote, onAdded, hideWishlist = false }: { product: Product; sizeGuide?: React.ReactNode; deliveryNote?: string; onAdded?: () => void; hideWishlist?: boolean }) {
  const cart = useCart();
  const wish = useWishlist();
  const toast = useToast();
  const router = useRouter();

  const sizes = useMemo(() => [...new Set(product.variants.map((v) => v.size).filter(Boolean))] as string[], [product]);
  const colors = useMemo(() => {
    const m = new Map<string, string | undefined>();
    product.variants.forEach((v) => v.color && m.set(v.color, v.colorHex));
    return [...m].map(([name, hex]) => ({ name, hex }));
  }, [product]);

  const [size, setSize] = useState<string | undefined>(sizes.length === 1 ? sizes[0] : undefined);
  const [color, setColor] = useState<string | undefined>(colors.length === 1 ? colors[0].name : undefined);
  const [wantQty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "adding" | "added">("idle");
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  const resolved = resolveVariant(product, { size, color });
  const variant = resolved.variant;
  const available = variant ? availableUnits(variant) : 0;
  const soldOutAll = product.variants.every((v) => availableUnits(v) <= 0);

  // Quantity is always clamped to what is available for the selected option.
  const maxQty = Math.max(1, Math.min(available || 1, MAX_QTY_PER_LINE));
  const qty = Math.min(wantQty, maxQty);

  const sizeAvailable = (s: string) => product.variants.some((v) => v.size === s && (!color || v.color === color) && availableUnits(v) > 0);
  const colorAvailable = (c: string) => product.variants.some((v) => v.color === c && (!size || v.size === size) && availableUnits(v) > 0);

  function validate(): boolean {
    if (resolved.error) { setError(resolved.error); return false; }
    if (!variant || available <= 0) { setError("This option is currently sold out."); return false; }
    setError(null);
    return true;
  }

  async function add(buyNow = false) {
    if (!validate() || !variant) return;
    setPhase("adding");
    cart.add({ productId: product.id, variantId: variant.id, quantity: qty });
    await new Promise((r) => setTimeout(r, 350)); // brief, deliberate feedback beat
    setPhase("added");
    toast(`${product.name} added to your bag`);
    onAdded?.();
    if (buyNow) router.push("/checkout"); else { cart.setOpen(true); setTimeout(() => setPhase("idle"), 1800); }
  }

  const wished = wish.has(product.id);
  const lowNote = variant && available > 0 && available <= Math.max(product.lowStockThreshold, 1) ? `Only ${available} left` : null;

  return (
    <div>
      {colors.length > 0 && (
        <fieldset className="mt-8">
          <legend className="label">Colour{color && <span className="ml-2 normal-case tracking-normal text-espresso">{color}</span>}</legend>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <button key={c.name} type="button" onClick={() => { setColor(c.name); setError(null); }} aria-pressed={color === c.name} aria-label={`${c.name}${colorAvailable(c.name) ? "" : " (sold out)"}`}
                className={`relative h-9 w-9 rounded-full border transition ${color === c.name ? "border-espresso ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "border-line hover:border-taupe"} ${colorAvailable(c.name) ? "" : "opacity-40"}`}
                style={{ background: c.hex || "#d8cbb8" }}>
                {!colorAvailable(c.name) && <span className="absolute inset-0 m-auto h-px w-full rotate-45 bg-espresso/60" />}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset className="mt-7">
          <legend className="label flex w-full items-center justify-between"><span>Size{size && <span className="ml-2 normal-case tracking-normal text-espresso">{size}</span>}</span>{sizeGuide}</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button key={s} type="button" onClick={() => { setSize(s); setError(null); }} aria-pressed={size === s} disabled={false}
                className={`relative min-h-11 min-w-14 rounded-full border px-5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${size === s ? "border-espresso bg-espresso text-white shadow-md" : "border-espresso/70 bg-white/60 hover:bg-blush hover:text-gold-deep"} ${sizeAvailable(s) ? "" : "!border-line text-taupe line-through"}`}>
                {s}<span className="sr-only">{sizeAvailable(s) ? "" : " (sold out)"}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-5">
        <div className="inline-flex items-center rounded-full border border-espresso/30 bg-white/60" role="group" aria-label="Quantity">
          <button type="button" className="grid h-11 w-12 place-items-center rounded-full transition hover:bg-blush disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(qty - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
          <span className="w-10 text-center tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" className="grid h-11 w-12 place-items-center rounded-full transition hover:bg-blush disabled:opacity-40" disabled={qty >= maxQty} onClick={() => setQty(qty + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
        </div>
        <p className={`text-sm ${soldOutAll ? "text-danger" : lowNote ? "text-gold-deep" : "text-ok"}`} aria-live="polite">
          {soldOutAll ? "Sold out" : lowNote ?? (variant ? "In stock" : (needsSize(product) || needsColor(product)) ? "Select options" : "")}
        </p>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 flex flex-col gap-3">
        <button type="button" className="btn btn-ghost !min-h-14 w-full !text-sm !normal-case !tracking-[0.08em]" disabled={soldOutAll || phase === "adding"} onClick={() => add(false)}>
          {phase === "adding" ? <Loader2 size={16} className="animate-spin" /> : phase === "added" ? <><Check size={16} /> Added</> : soldOutAll ? "Sold out" : <>Add to Cart</>}
        </button>
        <div className="flex gap-3">
          <button type="button" className="btn btn-solid !min-h-14 w-full flex-1 !text-sm !normal-case !tracking-[0.08em]" disabled={soldOutAll || phase === "adding"} onClick={() => add(true)}>Buy Now</button>
          {!hideWishlist && (
            <button type="button" onClick={() => { const added = wish.toggle(product.id); toast(added ? "Saved to your wishlist" : "Removed from wishlist"); }} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              className="btn btn-ghost !min-h-14 w-14 shrink-0 !px-0"><Heart size={18} className={`transition-all duration-300 ${wished ? "scale-110 fill-gold-deep text-gold-deep" : ""}`} /></button>
          )}
        </div>
      </div>

      {deliveryNote !== undefined && (
        <div className="mt-8 border-t border-line pt-6">
          <p className="label flex items-center gap-2"><Truck size={14} /> Delivery</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPinMsg(/^\d{6}$/.test(pin) ? (deliveryNote || "We deliver across India. Delivery time is confirmed at checkout.") : "Enter a valid 6-digit PIN code."); }}>
            <label htmlFor="pin" className="sr-only">PIN code</label>
            <input id="pin" inputMode="numeric" maxLength={6} className="field max-w-40" placeholder="PIN code" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
            <button className="btn btn-ghost px-5" type="submit">Check</button>
          </form>
          {pinMsg && <p className="mt-2 text-sm text-taupe-deep" role="status">{pinMsg}</p>}
        </div>
      )}
    </div>
  );
}
