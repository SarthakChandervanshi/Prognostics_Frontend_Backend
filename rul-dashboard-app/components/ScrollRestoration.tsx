"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { stripBasePath } from "@/lib/basePath";

/**
 * On `/` with no hash: force scroll to top so the hero is shown (avoids restored
 * mid-page scroll landing near #problem). Skips when the URL targets a section.
 */
export default function ScrollRestoration() {
  const pathname = usePathname();
  const routePath = stripBasePath(pathname);

  useLayoutEffect(() => {
    if (routePath !== "/") return;
    if (typeof window === "undefined") return;
    if (window.location.hash) return;

    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, [routePath]);

  return null;
}
