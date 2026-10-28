import { ProductGridSkeleton } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="container-x py-16" aria-busy="true">
      <div className="skeleton mb-3 h-3 w-24" />
      <div className="skeleton mb-12 h-14 w-2/3 max-w-lg" />
      <ProductGridSkeleton n={8} />
    </div>
  );
}
