import { NextResponse } from "next/server";
import { getProductsByIds, toPublicProduct } from "@/lib/server/catalog";

export const revalidate = 60;

/** Public, read-only lookup of PUBLISHED products by id (wishlist, recently viewed). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 40);
  const products = (await getProductsByIds(ids)).map(toPublicProduct);
  // keep caller's ordering
  products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return NextResponse.json({ products }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
}
