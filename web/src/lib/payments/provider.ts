import type { Paise } from "../types";

export interface ProviderOrder {
  providerOrderId: string;
  amount: Paise;
  currency: "INR";
  publicKey: string;
  mode: "test" | "live";
}

export interface ProviderRefund {
  id: string;
  amount: Paise;
  status: string;
}

/** Payment-provider contract so another gateway can be added without touching order logic. */
export interface PaymentProvider {
  readonly name: "razorpay";
  mode(): "test" | "live";
  createOrder(args: { receipt: string; amount: Paise; notes?: Record<string, string> }): Promise<ProviderOrder>;
  verifyCheckout(args: { providerOrderId: string; paymentId: string; signature: string }): boolean;
  /** Authoritative payment state fetched directly from the provider. */
  fetchPayment(paymentId: string): Promise<{ id: string; orderId: string; status: string; amount: Paise; amountRefunded: Paise }>;
  refund(args: { paymentId: string; amount: Paise; notes?: Record<string, string> }): Promise<ProviderRefund>;
}
