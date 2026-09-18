import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: "/api/market/spark",
        destination: "https://query1.finance.yahoo.com/v7/finance/spark",
      },
      {
        source: "/api/market/chart/:symbol",
        destination:
          "https://query1.finance.yahoo.com/v8/finance/chart/:symbol",
      },
    ];
  },
};

export default nextConfig;
