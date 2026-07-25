import type { NextConfig } from "next";

const allowedDevOrigins =
  process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",").filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  poweredByHeader: false,
};

export default nextConfig;
