import type { Metadata } from "next";
import { OrderDetailView } from "@/components/account/Views";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };
export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderDetailView orderId={orderId} />;
}
