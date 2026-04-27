/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  turbopack: {
    root: '/Users/cto/Documents/Repositories/02-Pro/image-text-extractor'
  }
}

export default nextConfig;
