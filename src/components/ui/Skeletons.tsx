export function ProductCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="skeleton mt-4 h-4 w-3/4" />
      <div className="skeleton mt-2 h-4 w-1/3" />
    </div>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: n }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function EmptyState({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="font-serif text-3xl">{title}</p>
      {text && <p className="mt-3 text-taupe-deep">{text}</p>}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
