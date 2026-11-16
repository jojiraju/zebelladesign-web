import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PILL = "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:bg-blush";

/** Section header for the home shelves: large serif title (optional italic accent word), subtitle, and a "View All" pill on the right. */
export function ShelfHead({ id, eyebrow, title, accent, subtitle, href, onSeeAll, seeAllLabel = "See All" }: {
  id?: string; eyebrow?: string; title: string; accent?: string; subtitle?: string;
  href?: string; onSeeAll?: () => void; seeAllLabel?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4 sm:mb-10">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id} className="h-section font-serif">{title}{accent && <> <span className="italic text-gradient">{accent}</span></>}</h2>
        {subtitle && <p className="mt-2 text-sm text-taupe-deep sm:text-base">{subtitle}</p>}
      </div>
      {href && <Link href={href} className={PILL}>{seeAllLabel} <ArrowRight size={14} aria-hidden /></Link>}
      {!href && onSeeAll && <button type="button" onClick={onSeeAll} className={`${PILL} cursor-pointer`}>{seeAllLabel} <ArrowRight size={14} aria-hidden /></button>}
    </div>
  );
}
