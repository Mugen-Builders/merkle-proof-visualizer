import type { NextConfig } from "next";

const repo = "merkle-proof-visualizer";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Generate a static site into /out
  output: "export",

  // GitHub Pages serves under /<repo>/ for project pages
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",

  // Helps static hosting + refreshes on nested routes
  trailingSlash: true,

  // Next/Image optimization needs a server; disable for static export
  images: { unoptimized: true },
};

export default nextConfig;
