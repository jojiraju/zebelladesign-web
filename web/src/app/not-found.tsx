import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-serif text-6xl">This page has slipped away</h1>
        <p className="mx-auto mt-4 max-w-md text-taupe-deep">The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to something beautiful.</p>
        <div className="mt-10 flex justify-center gap-3"><Link href="/" className="btn btn-solid">Home</Link><Link href="/shop" className="btn btn-ghost">Shop</Link></div>
      </div>
    </div>
  );
}
