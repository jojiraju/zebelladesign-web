"use client";
import { useEffect, useRef, useState } from "react";
import { authFetch } from "@/lib/firebase/client";
import type { CartItemInput, Quote } from "@/lib/types";

export interface QuoteState {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
}

/** Fetches the AUTHORITATIVE price of the bag from the server (debounced, race-safe). */
export function useQuote(items: CartItemInput[], couponCode: string, shippingMethodId?: string): QuoteState {
  const [state, setState] = useState<QuoteState>({ quote: null, loading: items.length > 0, error: null, configured: true });
  const seq = useRef(0);
  const sig = JSON.stringify([items, couponCode, shippingMethodId]);

  useEffect(() => {
    if (items.length === 0) {
      setState({ quote: null, loading: false, error: null, configured: true });
      return;
    }
    const mine = ++seq.current;
    setState((s) => ({ ...s, loading: true }));
    const t = setTimeout(async () => {
      try {
        const res = await authFetch("/api/cart/quote", { method: "POST", body: JSON.stringify({ items, couponCode: couponCode || undefined, shippingMethodId }) });
        const data = await res.json();
        if (mine !== seq.current) return; // a newer request superseded this one
        if (!res.ok) throw new Error(data.error ?? "Could not price your bag.");
        setState({ quote: data.quote, loading: false, error: null, configured: data.configured !== false });
      } catch (e) {
        if (mine !== seq.current) return;
        setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Could not price your bag." }));
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return state;
}
