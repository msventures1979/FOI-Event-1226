import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gästelisten (XLSX) können größer als das Standardlimit von 1 MB sein
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
};

export default nextConfig;
