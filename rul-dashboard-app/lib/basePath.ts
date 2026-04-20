/**
 * Subpath when the app is deployed under a URL prefix (e.g. `https://domain.com/rul-dashboard-app`).
 * Resolved in `next.config.ts` (Vercel defaults + `env.NEXT_PUBLIC_BASE_PATH`). Optional override: set
 * `NEXT_PUBLIC_BASE_PATH` in Vercel or `.env.local`.
 */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

/** Use for `fetch`, `<img src>`, etc. `next/link` and `next/image` apply `basePath` automatically. */
export function withBasePath(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/**
 * Normalize `usePathname()` for comparisons to `"/"` or `"/dashboard"` whether or not the runtime
 * includes the configured `basePath` in the returned string.
 */
export function stripBasePath(pathname: string): string {
  const base = getBasePath();
  if (!base) return pathname;
  if (pathname === base || pathname === `${base}/`) return "/";
  if (pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length) || "/";
  }
  return pathname;
}
