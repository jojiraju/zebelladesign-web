import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * Product and content images are served by the backend under /media/ (zebelladesign-api).
 * Allow that host for next/image, derived from NEXT_PUBLIC_API_URL so it follows each environment.
 */
function backendMediaPattern(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number] | null {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const protocol = url.protocol.replace(":", "");
    if (protocol !== "http" && protocol !== "https") return null;
    return { protocol, hostname: url.hostname, port: url.port, pathname: "/media/**" };
  } catch {
    return null;
  }
}

const backendMedia = backendMediaPattern();
// Next blocks optimising images from local addresses (SSRF protection). Lift that only in development,
// where the backend runs on this machine; a live backend has a public domain and keeps the protection.
const localBackendInDev =
  process.env.NODE_ENV === "development" && !!backendMedia && ["localhost", "127.0.0.1", "[::1]"].includes(backendMedia.hostname);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // In development, re-optimise images almost immediately so replacing a file in /public (e.g. a new ad banner with the same name)
    // shows up right away. Production keeps Next's default long cache.
    ...(process.env.NODE_ENV === "development" ? { minimumCacheTTL: 1 } : {}),
    ...(localBackendInDev ? { dangerouslyAllowLocalIP: true } : {}),
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      ...(backendMedia ? [backendMedia] : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
