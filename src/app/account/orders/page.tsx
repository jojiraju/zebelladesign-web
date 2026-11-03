import type { Metadata } from "next";
import { OrdersView } from "@/components/account/Views";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };
export default function Page() {
  return <OrdersView />;
}
