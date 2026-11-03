import type { Metadata } from "next";
import { AddressesView } from "@/components/account/Views";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };
export default function Page() {
  return <AddressesView />;
}
