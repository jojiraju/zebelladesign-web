import type { Metadata } from "next";
import { OverviewView } from "@/components/account/Views";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export default function Page() {
  return <OverviewView />;
}
