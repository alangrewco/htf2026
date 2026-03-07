import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    if (!backendOrigin) {
      return [];
    }

    return [
      {
        source: "/reference/:path*",
        destination: `${backendOrigin}/api/v1/reference/:path*`,
      },
      {
        source: "/ingestion/:path*",
        destination: `${backendOrigin}/api/v1/ingestion/:path*`,
      },
      {
        source: "/articles/:path*",
        destination: `${backendOrigin}/api/v1/articles/:path*`,
      },
      {
        source: "/incidents/:path*",
        destination: `${backendOrigin}/api/v1/incidents/:path*`,
      },
      {
        source: "/proposals/:path*",
        destination: `${backendOrigin}/api/v1/proposals/:path*`,
      },
      {
        source: "/company/:path*",
        destination: `${backendOrigin}/api/v1/company/:path*`,
      },
      {
        source: "/config/:path*",
        destination: `${backendOrigin}/api/v1/config/:path*`,
      },
      {
        source: "/feedback/:path*",
        destination: `${backendOrigin}/api/v1/feedback/:path*`,
      },
    ];
  },
};

export default nextConfig;
