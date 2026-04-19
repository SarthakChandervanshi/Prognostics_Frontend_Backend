import { getBasePath } from "@/lib/basePath";

/** Used by Navbar / in-page links — Next.js `<Link>` does not smooth-scroll to `#id` on the same route. */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToSection(id: string) {
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  const base = getBasePath();

  if (id === "home") {
    window.scrollTo({ top: 0, behavior });
    window.history.replaceState(null, "", base ? `${base}/` : "/");
    return;
  }

  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior, block: "start" });
    window.history.replaceState(null, "", `${base}/#${id}`);
  }
}
