import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { getSettings } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
// Personal/transactional page: never cached publicly.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="container-x py-8 sm:py-14">
      <CheckoutFlow methods={settings.shippingMethods} />
    </div>
  );
}
