"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

/**
 * Reset window scroll on every client-side route change (home ↔ dashboard, etc.) so
 * a long scroll on one page is not carried over. `ScrollToHash` still runs after on `/`
 * when the URL has a hash to scroll to the right section.
 */
export default function ScrollRestoration() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
