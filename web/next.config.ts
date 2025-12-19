import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Required for Cloudflare Pages deployment
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "imagedelivery.net" }, // Cloudflare Images
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  webpack: (config) => {
    // Force supabase-js to use the module build we patched so createClient is available
    config.resolve.alias["@supabase/supabase-js"] =
      "@supabase/supabase-js/dist/module/index.js";
    return config;
  },
  experimental: {
    // Helps Webpack handle mixed ESM/CJS deps like supabase-js on Next 15 Webpack builds
    esmExternals: "loose",
    optimizePackageImports: ["lucide-react"],
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
