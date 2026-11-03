import type { Metadata } from "next";
import { PolicyPage } from "@/components/pages/Policy";

export const revalidate = 60;
export const metadata: Metadata = { title: "Shipping Policy", alternates: { canonical: "/shipping-policy" } };
export default function Page() {
  return <PolicyPage title="Shipping Policy" policyKey="shipping" />;
}
