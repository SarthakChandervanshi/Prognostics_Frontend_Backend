import type { NextConfig } from "next";

/**
 * 1) Use `NEXT_PUBLIC_BASE_PATH` from Vercel / `.env.local` when set.
 * 2) On Vercel (`VERCEL` is set during `next build`), default to `/rul-dashboard-app` so Production
 *    is not only served at `/` while `https://…/rul-dashboard-app` 404s (env sometimes missing from build).
 * 3) Local `next dev` has no `VERCEL` → no prefix unless you set `NEXT_PUBLIC_BASE_PATH`.
 *
 * `env.NEXT_PUBLIC_BASE_PATH` keeps client `getBasePath()` / `withBasePath()` in sync with `basePath`.
 */
const resolvedBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.trim() ||
  (process.env.VERCEL ? "/rul-dashboard-app" : "");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BASE_PATH: resolvedBasePath,
  },
  ...(resolvedBasePath ? { basePath: resolvedBasePath } : {}),
};

export default nextConfig;
