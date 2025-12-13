import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "imagedelivery.net" }, // Cloudflare Images
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
