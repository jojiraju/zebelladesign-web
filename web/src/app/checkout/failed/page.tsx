import type { Metadata } from "next";
import { FailedView } from "@/components/checkout/Outcome";

export const metadata: Metadata = { title: "Payment unsuccessful", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string; reason?: string }> }) {
  const { order, reason } = await searchParams;
  return <div className="container-x"><FailedView orderId={order} reason={reason?.slice(0, 200)} /></div>;
}
