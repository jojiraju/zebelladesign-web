"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { CartContents } from "./CartContents";

export function CartDrawer() {
  const { open, setOpen, count } = useCart();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-espresso/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside role="dialog" aria-modal="true" aria-label="Shopping bag"
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col overflow-hidden bg-ivory text-espresso shadow-[-30px_0_80px_-30px_rgba(35,26,29,.5)] sm:rounded-l-[1.75rem]"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center justify-between px-6 pb-4 pt-6">
              <h2 className="flex items-center gap-3 font-serif text-3xl">Your bag <span className="grid h-7 min-w-7 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep px-2 font-sans text-xs font-semibold text-white">{count}</span></h2>
              <button autoFocus onClick={() => setOpen(false)} aria-label="Close bag" className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition hover:bg-blush"><X size={20} strokeWidth={1.5} /></button>
            </div>
            <CartContents variant="drawer" onNavigate={() => setOpen(false)} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
