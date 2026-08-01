import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove X-Powered-By header
  poweredByHeader: false,

  // Strict mode
  reactStrictMode: true,

  // API rewrites for development
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000"}/api/v1/:path*`,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  // Webpack config to disable cache in development and bypass Node.js V8 deopt crashes
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
