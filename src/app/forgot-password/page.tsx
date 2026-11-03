import type { Metadata } from "next";
import { AuthCard } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };
export default function ForgotPage() {
  return <AuthCard mode="forgot" title="Reset your password" subtitle="Account help" />;
}
