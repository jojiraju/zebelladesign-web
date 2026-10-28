import Link from "next/link";
import Image from "next/image";

/**
 * Brand lockup built from the supplied Ze Bella logo files (public/brand): the ZB monogram beside the
 * wordmark. `light` swaps to the pale-rose variants for dark/photographic backgrounds.
 */
export function Logo({ className = "", light = false, stacked = false }: { className?: string; light?: boolean; stacked?: boolean }) {
  const sfx = light ? "-light" : "";
  return (
    <Link href="/" aria-label="Zebella Designs — home" className={`group inline-flex items-center ${stacked ? "flex-col gap-2" : "gap-3"} ${className}`}>
      <Image src={`/brand/logo-mark${sfx}.png`} alt="" width={500} height={414} priority className={`${stacked ? "h-16" : "h-10"} w-auto transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-110 group-hover:-rotate-3 group-active:scale-95`} />
      <Image src={`/brand/logo-wordmark${sfx}.png`} alt="" width={800} height={132} priority className={`${stacked ? "h-5" : "h-[1.05rem]"} w-auto transition-[letter-spacing,opacity,transform] duration-500 group-hover:translate-x-0.5 group-hover:opacity-80`} />
    </Link>
  );
}

/** Full vertical lockup (monogram + wordmark + tagline) for hero/footer/empty states. */
export function LogoFull({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return <Image src={`/brand/logo-full${light ? "-light" : ""}.png`} alt="Ze Bella — elegant dresses for every occasion" width={1000} height={793} className={`h-auto w-full ${className}`} />;
}
