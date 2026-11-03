import type { Metadata } from "next";
import { ProfileView } from "@/components/account/Views";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };
export default function Page() {
  return <ProfileView />;
}
