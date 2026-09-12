import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Development-only allowance for the sandboxed preview host.
   * Next.js blocks cross-origin requests to its dev resources (HMR, dev
   * assets) by default, which stops the app from hydrating when it is opened
   * through a proxy such as https://<port>-<sandbox>.e2b.app.
   */
  allowedDevOrigins: [
    "*.e2b.app",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
