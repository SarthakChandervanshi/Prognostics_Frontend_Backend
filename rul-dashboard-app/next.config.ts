import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/experimentation-dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
