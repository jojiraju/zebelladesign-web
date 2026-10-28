import type { Metadata } from "next";
import { ProfileView } from "@/components/account/Views";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };
export default function Page() {
  return <AccountShell title="Profile"><ProfileView /></AccountShell>;
}
