"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { scrollToSection } from "@/lib/scrollToSection";
import { Gauge } from "lucide-react";

const SECTION_IDS = [
  "home",
  "problem",
  "method",
  "results",
  "interpretability",
  "comparison",
] as const;

const links = [
  { id: "home" as const, href: "/#home", label: "Home" },
  { id: "problem" as const, href: "/#problem", label: "Problem" },
  { id: "method" as const, href: "/#method", label: "Method" },
  { id: "results" as const, href: "/#results", label: "Results" },
  { id: "interpretability" as const, href: "/#interpretability", label: "Interpretability" },
  { id: "comparison" as const, href: "/#comparison", label: "Comparison" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [active, setActive] = useState<string>("home");

  const handleSamePageHashClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, id: string) => {
      if (pathname !== "/") return;
      e.preventDefault();
      scrollToSection(id);
      // Immediate highlight; scroll-spy will sync on scroll end (fixes perceived lag)
      setActive(id);
    },
    [pathname]
  );

  useEffect(() => {
    if (pathname !== "/") return;

    /**
     * Sections use scroll-mt-28 — after scrollIntoView, getBoundingClientRect().top is
     * ~112px, not 0. Comparing document scrollY + offsetTop was always one section behind.
     * Use viewport coords minus scroll-margin so the "anchor line" matches the sticky header.
     */
    const update = () => {
      const header = document.querySelector("header");
      const headerH = header?.getBoundingClientRect().height ?? 72;
      const line = headerH + 12;

      let current = "home";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const scrollMarginTop =
          parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        const effectiveTop = rect.top - scrollMarginTop;
        if (effectiveTop <= line) {
          current = id;
        }
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/#home"
          scroll={false}
          title="Digital Twin Framework for Industrial Asset Prognostics"
          className="flex min-w-0 items-center gap-2 font-semibold tracking-tight"
          onClick={(e) => handleSamePageHashClick(e, "home")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <Gauge className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden max-w-[14rem] truncate text-left text-sm font-semibold leading-tight sm:inline md:max-w-md lg:max-w-xl xl:max-w-none xl:whitespace-normal">
            Digital Twin Framework for Industrial Asset Prognostics
          </span>
        </Link>
        <ul className="flex max-w-[min(100vw-12rem,42rem)] flex-wrap items-center justify-end gap-1 overflow-x-auto text-sm md:max-w-none md:gap-2">
          {links.map(({ id, href, label }) => {
            const isActive = onHome && active === id;
            return (
              <li key={id}>
                <Link
                  href={href}
                  scroll={false}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground",
                    isActive ? "bg-muted text-primary" : "text-muted-foreground"
                  )}
                  onClick={(e) => handleSamePageHashClick(e, id)}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/dashboard"
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground",
                pathname === "/dashboard" ? "bg-muted text-primary" : "text-muted-foreground"
              )}
            >
              Dashboard
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
