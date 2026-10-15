import { useEffect } from "react";
import { fx } from "./fxBus";

/**
 * Keeps the normal system cursor. Adds only a soft ripple inside buttons when pressed,
 * plus a small spark burst for the few primary actions marked with data-burst.
 */
export function ClickFeedback() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function down(e: PointerEvent) {
      const t = e.target instanceof Element ? e.target : null;
      const target = t?.closest<HTMLElement>("button, a, summary");
      if (!target || target.hasAttribute("disabled") || reduced) return;
      const r = target.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "fx-ripple";
      const d = Math.max(r.width, r.height) * 2.2;
      ripple.style.width = ripple.style.height = `${d}px`;
      ripple.style.left = `${e.clientX - r.left - d / 2}px`;
      ripple.style.top = `${e.clientY - r.top - d / 2}px`;
      if (getComputedStyle(target).position === "static") target.style.position = "relative";
      target.classList.add("fx-ripple-host");
      target.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 700);
      if (target.dataset["burst"]) fx.emit("burst", { x: e.clientX, y: e.clientY, strength: 1.4 });
    }
    window.addEventListener("pointerdown", down);
    return () => window.removeEventListener("pointerdown", down);
  }, []);
  return null;
}
