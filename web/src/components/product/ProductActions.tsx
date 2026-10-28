"use client";
import { Heart, Share2 } from "lucide-react";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useToast } from "@/components/providers/ToastProvider";

/** Round wishlist + share buttons shown beside the product title. */
export function ProductActions({ productId, name }: { productId: string; name: string }) {
  const wish = useWishlist();
  const toast = useToast();
  const wished = wish.has(productId);
  const btn = "group/a grid h-11 w-11 place-items-center rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:bg-blush hover:text-gold-deep active:scale-90";

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); toast("Link copied"); }
    } catch { /* share sheet dismissed */ }
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} className={btn}
        onClick={() => toast(wish.toggle(productId) ? "Saved to your wishlist" : "Removed from wishlist")}>
        <Heart size={22} strokeWidth={1.5} className={`transition-all duration-300 group-hover/a:scale-110 ${wished ? "scale-110 fill-gold-deep text-gold-deep" : ""}`} />
      </button>
      <button type="button" aria-label="Share this product" className={btn} onClick={share}><Share2 size={20} strokeWidth={1.5} className="transition-transform duration-300 group-hover/a:scale-110" /></button>
    </div>
  );
}
