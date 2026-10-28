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
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-md flex-col bg-ivory p-6 text-espresso"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-3xl">Your bag <span className="text-lg text-taupe-deep">({count})</span></h2>
              <button autoFocus onClick={() => setOpen(false)} aria-label="Close bag" className="grid h-11 w-11 place-items-center"><X size={22} strokeWidth={1.4} /></button>
            </div>
            <CartContents variant="drawer" onNavigate={() => setOpen(false)} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
