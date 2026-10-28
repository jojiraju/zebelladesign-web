"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV = [
  ["/account", "Overview"], ["/account/orders", "Orders"], ["/account/wishlist", "Wishlist"],
  ["/account/addresses", "Addresses"], ["/account/profile", "Profile"],
] as const;

/** Client-side route guard + account chrome. (Data access is protected by Firestore rules, not by this redirect.) */
export function AccountShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, ready, configured } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => { if (ready && !user && configured) router.replace(`/login?next=${encodeURIComponent(path)}`); }, [ready, user, configured, router, path]);

  if (!configured) return <div className="container-x py-24 text-center"><p className="font-serif text-3xl">Accounts aren&apos;t available yet</p><p className="mt-2 text-taupe-deep">Firebase has not been configured for this site.</p></div>;
  if (!ready || !user) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-taupe" /></div>;

  return (
    <div className="container-x py-12 sm:py-16">
      <h1 className="font-serif text-5xl">{title}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Account" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line pb-3 lg:flex-col lg:gap-3 lg:border-b-0">
          {NAV.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className="link-underline whitespace-nowrap text-xs font-medium uppercase tracking-[0.2em]">{label}</Link>)}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
