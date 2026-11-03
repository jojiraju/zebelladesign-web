import type { Metadata } from "next";
import { OverviewView } from "@/components/account/Views";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export default function Page() {
  return <AccountShell title="My account"><OverviewView /></AccountShell>;
}
