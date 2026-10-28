import type { Metadata } from "next";
import { PolicyPage } from "@/components/pages/Policy";

export const revalidate = 60;
export const metadata: Metadata = { title: "Returns & Refunds", alternates: { canonical: "/returns-policy" } };
export default function Page() {
  return <PolicyPage title="Returns & Refunds" policyKey="returns" />;
}
