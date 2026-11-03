import type { Metadata } from "next";
import { AuthCard } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };
export default function Page() {
  return <AuthCard mode="forgot" />;
}
