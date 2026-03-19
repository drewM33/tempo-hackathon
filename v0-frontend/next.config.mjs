import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Anchor Turbopack to the hackathon monorepo root so it does not climb to e.g.
 * `~/pnpm-lock.yaml` (which makes the dev server serve the wrong tree → all 404s).
 *
 * Aliases point Tailwind packages at this app's node_modules because resolution for
 * PostCSS starts from the turbopack root (parent dir), where those deps are not installed.
 */
const monorepoRoot = path.resolve(__dirname, "..");
const appDir = path.resolve(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      tailwindcss: path.join(appDir, "node_modules/tailwindcss"),
      "@tailwindcss/postcss": path.join(
        appDir,
        "node_modules/@tailwindcss/postcss"
      ),
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
