/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongoose"],
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
