import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.giphy.com",
      },
    ],
  },
  // Turbopack configuration (Next.js 16+)
  // Empty config to silence the warning - webpack config handles Node.js module exclusion
  turbopack: {},
  // Webpack configuration (fallback for --webpack flag)
  webpack: (config, { isServer }) => {
    // Ignore Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
