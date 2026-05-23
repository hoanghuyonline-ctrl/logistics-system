import type { NextConfig } from "next";

const r2Domain = process.env.R2_PUBLIC_CUSTOM_DOMAIN
  ? new URL(process.env.R2_PUBLIC_CUSTOM_DOMAIN).hostname
  : null;

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/adapter-pg", "@aws-sdk/client-s3"],
  images: {
    remotePatterns: [
      ...(r2Domain
        ? [{ protocol: "https" as const, hostname: r2Domain }]
        : []),
    ],
  },
  async headers() {
    return [];
  },
  allowedDevOrigins: ["*"],
};

export default nextConfig;
