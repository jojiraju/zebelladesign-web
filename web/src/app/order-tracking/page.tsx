import type { Metadata } from "next";
import { TrackForm } from "@/components/pages/Forms";
import { ListingHeader } from "@/components/shop/Listing";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

export default function Page() {
  return (
    <div className="container-x py-12 sm:py-20">
      <ListingHeader eyebrow="Order status" title="Track your order" description="Enter your order ID and the email address you used at checkout." />
      <div className="mt-12"><TrackForm /></div>
    </div>
  );
}
