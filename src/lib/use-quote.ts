"use client";
import { useEffect, useRef, useState } from "react";
import { apiJson, friendlyError, isApiConfigured } from "@/lib/api/client";
import type { CartItemInput, Quote } from "@/lib/types";

export interface QuoteState {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
}

/** Fetches the AUTHORITATIVE price of the bag from the server (debounced, race-safe). */
export function useQuote(items: CartItemInput[], couponCode: string, shippingMethodId?: string): QuoteState {
  const [state, setState] = useState<QuoteState>({ quote: null, loading: items.length > 0, error: null, configured: isApiConfigured() });
  const seq = useRef(0);
  const sig = JSON.stringify([items, couponCode, shippingMethodId]);

  useEffect(() => {
    const mine = ++seq.current; // also cancels a request still in flight when the bag was just emptied
    if (items.length === 0) {
      setState({ quote: null, loading: false, error: null, configured: true });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const t = setTimeout(async () => {
      try {
        const data = await apiJson<{ quote: Quote; configured?: boolean }>("/cart/quote", { json: { items, couponCode: couponCode || undefined, shippingMethodId } });
        if (mine !== seq.current) return; // a newer request superseded this one
        setState({ quote: data.quote, loading: false, error: null, configured: data.configured !== false });
      } catch (e) {
        if (mine !== seq.current) return;
        // Drop the old quote: it priced a different bag, so its total must not stay on screen or be payable.
        setState((s) => ({ ...s, quote: null, loading: false, error: friendlyError(e, "Could not price your bag. Please check your connection.") }));
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return state;
}
