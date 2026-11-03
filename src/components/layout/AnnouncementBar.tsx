"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Announcement } from "@/lib/content";

/** Rotates CMS-managed announcements. With a single message it is static. */
export function AnnouncementBar({ items }: { items: Announcement[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return null;
  const a = items[i % items.length];
  const body = <span className="link-underline">{a.text}</span>;
  return (
    <div className="relative z-[60] bg-espresso text-ivory" role="region" aria-label="Announcements">
      <div className="container-x flex h-9 items-center justify-center overflow-hidden text-[0.68rem] uppercase tracking-[0.28em]">
        <AnimatePresence mode="wait">
          <motion.div key={a.id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.4 }}>
            {a.href ? <Link href={a.href}>{body}</Link> : body}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
