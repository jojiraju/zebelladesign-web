import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getCategories, getCollections, getSettings } from "@/lib/server/catalog";
import { siteUrl } from "@/lib/site";

const serif = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz", "SOFT"], variable: "--font-fraunces", display: "swap" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Zebella Designs — Premium Women's Fashion", template: "%s | Zebella Designs" },
  description: "Zebella Designs — elegant dresses for every occasion. Premium women's ethnic and contemporary wear, designer kurta sets, sarees and festive collections.",
  openGraph: { type: "website", siteName: "Zebella Designs", locale: "en_IN" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#FDF8F6", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, collections] = await Promise.all([getSettings(), getCategories(), getCollections()]);
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col pb-24 lg:pb-0">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-espresso focus:px-4 focus:py-2 focus:text-ivory">Skip to content</a>
        <Providers>
          <AnnouncementBar items={settings.announcements} />
          <Header categories={categories} collections={collections} />
          <main id="main" className="flex-1">{children}</main>
          <Footer settings={settings} categories={categories} />
          <MobileBottomNav />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
