import type { Metadata } from "next";
import { OrdersView } from "@/components/account/Views";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };
export default function Page() {
  return <AccountShell title="Orders"><OrdersView /></AccountShell>;
}
