import Link from "next/link";
import { RichText } from "@/components/ui/RichText";
import { getSettings } from "@/lib/server/catalog";
import { ListingHeader } from "@/components/shop/Listing";

/** Policy text is owned by the business (edited in the CMS). We deliberately ship no invented legal copy. */
export async function PolicyPage({ title, policyKey }: { title: string; policyKey: "shipping" | "returns" | "privacy" | "terms" }) {
  const { policies, contact } = await getSettings();
  const text = policies[policyKey]?.trim();
  return (
    <div className="container-x py-12 sm:py-20">
      <ListingHeader eyebrow="Customer care" title={title} />
      <div className="prose-policy mt-12">
        {text ? <RichText html={text} /> : (
          <p>This policy has not been published yet. {contact.email ? <>Please <a className="underline" href={`mailto:${contact.email}`}>email us</a> with any questions.</> : <>Please <Link className="underline" href="/contact">contact us</Link> with any questions.</>}</p>
        )}
      </div>
    </div>
  );
}
