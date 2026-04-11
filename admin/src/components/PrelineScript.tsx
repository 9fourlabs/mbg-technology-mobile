"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PrelineScript() {
  const path = usePathname();

  useEffect(() => {
    const loadPreline = async () => {
      const { HSStaticMethods } = await import("preline");
      HSStaticMethods?.autoInit();
    };
    loadPreline();
  }, [path]);

  return null;
}
