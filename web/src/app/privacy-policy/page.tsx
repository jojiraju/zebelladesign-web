import type { Metadata } from "next";
import { PolicyPage } from "@/components/pages/Policy";

export const revalidate = 60;
export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } };
export default function Page() {
  return <PolicyPage title="Privacy Policy" policyKey="privacy" />;
}
