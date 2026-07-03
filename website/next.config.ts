import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The website lives inside a larger repo; pin the root so Next.js
  // doesn't pick up the parent app's lockfile or middleware.
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.pongs.com" },
      { protocol: "https", hostname: "pongs.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
