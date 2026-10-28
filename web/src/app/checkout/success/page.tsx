import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SuccessView } from "@/components/checkout/Outcome";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  if (!order) redirect("/account/orders");
  return <div className="container-x"><SuccessView orderId={order} /></div>;
}
