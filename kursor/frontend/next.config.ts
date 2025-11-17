import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fiujlzfouidrxbechcxa.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },

  // ✅ Prevent Vercel build from failing due to ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;