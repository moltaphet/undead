"use client";

import { useEffect } from "react";

/** Exposes the visual viewport height as --vvh so full-height layouts shrink with the on-screen keyboard. */
export function useVisualViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--vvh", `${vv.height}px`);
    update();
    vv.addEventListener("resize", update);
    return () => {
      vv.removeEventListener("resize", update);
      root.style.removeProperty("--vvh");
    };
  }, []);
}
