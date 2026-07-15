import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/finly',
  assetPrefix: '/finly/',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  turbopack: {},
};

export default withPWA(nextConfig);
