"use client";

import { useEffect } from "react";

export function DisableContextMenu({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); };
    document.addEventListener("contextmenu", handler);
    return () => { document.removeEventListener("contextmenu", handler); };
  }, []);

  return children as React.ReactElement;
}
