import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/motion";
import type { Product } from "@/lib/types";

export function ProductGrid({ products, cols = 4, priorityFirst = 0 }: { products: Product[]; cols?: 3 | 4; priorityFirst?: number }) {
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 ${cols === 4 ? "lg:grid-cols-4" : ""}`}>
      {products.map((p, i) => (
        <Reveal as="li" key={p.id} delay={(i % 4) * 0.07} y={22}>
          <ProductCard product={p} priority={i < priorityFirst} />
        </Reveal>
      ))}
    </ul>
  );
}
