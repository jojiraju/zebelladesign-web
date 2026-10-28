import type { Metadata } from "next";
import { PolicyPage } from "@/components/pages/Policy";

export const revalidate = 60;
export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };
export default function Page() {
  return <PolicyPage title="Terms & Conditions" policyKey="terms" />;
}
