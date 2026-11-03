import type { Metadata } from "next";
import { AuthCard } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export default function LoginPage() {
  return <AuthCard mode="login" title="Welcome back" subtitle="Sign in" />;
}
