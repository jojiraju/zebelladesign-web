"use client";
import { usePathname } from "next/navigation";

/**
 * Subtle CSS-only route transition. Never delays navigation or focus, and is disabled for reduced motion.
 * Skipped inside the account area, where it made the menu and page flash on every tab change.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <div className={path.startsWith("/account") ? undefined : "page-in"}>{children}</div>;
}
