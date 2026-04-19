"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/basePath";

/** Old multi-page URLs → single-page anchors. */
export default function RedirectToSection({ section }: { section: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(withBasePath(`/#${section}`));
  }, [router, section]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Opening section…
    </div>
  );
}
