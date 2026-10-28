import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { getSettings } from "@/lib/server/catalog";
import { isRazorpayConfigured, razorpayMode } from "@/lib/payments/razorpay";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
// Personal/transactional page: never cached publicly.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="container-x py-12 sm:py-16">
      <h1 className="mb-10 font-serif text-5xl">Checkout</h1>
      <CheckoutFlow methods={settings.shippingMethods} paymentMode={razorpayMode()} paymentsReady={isRazorpayConfigured()} />
    </div>
  );
}
