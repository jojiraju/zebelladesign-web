import type { Metadata } from "next";
import { AddressesView } from "@/components/account/Views";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };
export default function Page() {
  return <AccountShell title="Addresses"><AddressesView /></AccountShell>;
}
