"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { ProductGridSkeleton, EmptyState } from "@/components/ui/Skeletons";
import { useWishlist } from "@/components/providers/WishlistProvider";
import type { Product } from "@/lib/types";

async function load(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const res = await fetch(`/api/products/by-ids?ids=${encodeURIComponent(ids.join(","))}`);
  if (!res.ok) throw new Error("load failed");
  return (await res.json()).products;
}

type Status = "loading" | "ready" | "error";

/** Wishlist grid (client: depends on per-visitor saved ids). */
export function WishlistGrid() {
  const { ids } = useWishlist();
  const key = ids.join(",");
  const [result, setResult] = useState<{ key: string; status: "ready" | "error"; products: Product[] } | null>(null);
  useEffect(() => {
    let live = true;
    load(key ? key.split(",") : [])
      .then((products) => { if (live) setResult({ key, status: "ready", products }); })
      .catch(() => { if (live) setResult({ key, status: "error", products: [] }); });
    return () => { live = false; };
  }, [key]);
  // Until the response for the CURRENT ids arrives we are loading (derived, not stored).
  const status: Status = result?.key === key ? result.status : "loading";
  const products = result?.key === key ? result.products : [];

  if (status === "loading") return <ProductGridSkeleton n={Math.max(ids.length, 4)} />;
  if (status === "error") return <EmptyState title="We couldn't load your wishlist" text="Please refresh the page and try again." />;
  if (!products.length) return <EmptyState title="Your wishlist is empty" text="Tap the heart on any piece to save it here."><Link href="/shop" className="btn btn-solid">Explore the collection</Link></EmptyState>;
  return <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}</ul>;
}

const RV_KEY = "zebella.recent.v1";

/** Records the product being viewed (renders nothing). */
export function RecordView({ id }: { id: string }) {
  useEffect(() => {
    try {
      const cur: string[] = JSON.parse(localStorage.getItem(RV_KEY) ?? "[]");
      localStorage.setItem(RV_KEY, JSON.stringify([id, ...cur.filter((x) => x !== id)].slice(0, 12)));
    } catch { /* storage unavailable */ }
  }, [id]);
  return null;
}

export function RecentlyViewed({ excludeId }: { excludeId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    let live = true;
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(RV_KEY) ?? "[]").filter((x: string) => x !== excludeId).slice(0, 4);
      load(ids).then((p) => live && setProducts(p)).catch(() => undefined);
    } catch { /* ignore */ }
    return () => { live = false; };
  }, [excludeId]);
  if (!products.length) return null;
  return (
    <section className="container-x mt-24" aria-labelledby="rv">
      <h2 id="rv" className="h-section mb-10 font-serif">Recently viewed</h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">{products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}</ul>
    </section>
  );
}
