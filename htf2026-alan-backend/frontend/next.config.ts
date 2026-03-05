import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Proxy API calls to the Flask backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:5001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
