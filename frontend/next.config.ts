import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow access from your local network IP (e.g., viewing on phone/other PC)
  allowedDevOrigins: ["192.168.0.7"],

  // Proxy all /api requests to the Python FastAPI backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
