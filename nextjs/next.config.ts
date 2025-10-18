import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Allow iframe embedding from WordPress
  async headers() {
    return [
      {
        source: '/angie/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Allow all origins for development
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:* https://*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
