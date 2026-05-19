import path from "node:path";

const nextConfig = {
  serverExternalPackages: ["tesseract.js", "sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Pin Turbopack's project root to this directory. Without it, Turbopack walks
  // up and finds the workspace-root package-lock.json, then resolves node_modules
  // from there (where tailwindcss isn't installed) → CSS import failure in dev.
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      { source: "/v2", destination: "/dashboard", permanent: true },
      { source: "/v2/dashboard", destination: "/dashboard", permanent: true },
      { source: "/v2/reg-cards", destination: "/reg-cards", permanent: true },
      { source: "/v2/reg-cards/new", destination: "/reg-cards/new", permanent: true },
      { source: "/v2/rooms", destination: "/rooms", permanent: true },
      { source: "/v2/users", destination: "/users", permanent: true },
      { source: "/v2/extensions", destination: "/extensions", permanent: true },
      { source: "/v2/audit", destination: "/audit", permanent: true },
    ];
  },
};

export default nextConfig;
