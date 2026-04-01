/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: false,
  experimental: {
  },
  async rewrites() {
    return [
      {
        source: "/pipelines/:path*",
        destination: "http://localhost:3000/pipelines/:path*"
      },
      {
        source: "/runs/:path*",
        destination: "http://localhost:3000/runs/:path*"
      },
      {
        source: "/interactions/:path*",
        destination: "http://localhost:3000/interactions/:path*"
      },
      {
        source: "/interactions",
        destination: "http://localhost:3000/interactions"
      },
      {
        source: "/voice",
        destination: "http://localhost:3000/voice"
      },
      {
        source: "/nodes/:path*",
        destination: "http://localhost:3000/nodes/:path*"
      },
      {
        source: "/nodes",
        destination: "http://localhost:3000/nodes"
      },
      {
        source: "/health",
        destination: "http://localhost:3000/health"
      }
    ];
  }
};

export default nextConfig;

