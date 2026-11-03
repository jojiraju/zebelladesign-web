import type { Metadata } from "next";
import { AuthCard } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };
export default function Page() {
  return <AuthCard mode="reset" />;
}
