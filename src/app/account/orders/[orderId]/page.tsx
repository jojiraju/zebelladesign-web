import type { Metadata } from "next";
import { OrderDetailView } from "@/components/account/Views";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };
export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <AccountShell title="Order details"><OrderDetailView orderId={orderId} /></AccountShell>;
}
