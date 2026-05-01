/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: false },
      { source: "/en/:path*", destination: "/:path*", permanent: false },
    ];
  },
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  turbopack: {
    root: '/Users/cto/Documents/Repositories/02-Pro/image-text-extractor'
  }
}

export default nextConfig;
