/**
 * Tiny, dependency-free event bus that lets DOM interactions (clicks, stage changes)
 * drive the global Three.js backdrop without prop-drilling or re-rendering React.
 * Visual only: nothing here may ever influence financial calculations.
 */
export type Mood = "calm" | "storm" | "celebrate";

type BurstEvent = { x: number; y: number; strength?: number; color?: "gold" | "ivory" | "storm" };
type Events = {
  warp: { strength: number; direction: 1 | -1 };
  burst: BurstEvent;
  trail: { x: number; y: number };
  mood: Mood;
  celebrate: undefined;
  flash: undefined;
};
type Handler<K extends keyof Events> = (payload: Events[K]) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners: Partial<Record<keyof Events, Set<(payload: any) => void>>> = {};
let currentMood: Mood = "calm";

export const fx = {
  on<K extends keyof Events>(event: K, handler: Handler<K>) {
    const set = (listeners[event] ??= new Set());
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  },
  emit<K extends keyof Events>(
    event: K,
    ...payload: Events[K] extends undefined ? [] : [Events[K]]
  ) {
    if (event === "mood") currentMood = payload[0] as Mood;
    listeners[event]?.forEach((h) => h(payload[0]));
  },
  get mood() {
    return currentMood;
  },
  /** Fire a gold spark burst at a DOM element's centre. */
  burstAt(el: Element | null, strength = 1, color: BurstEvent["color"] = "gold") {
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    fx.emit("burst", { x: r.left + r.width / 2, y: r.top + r.height / 2, strength, color });
  },
};

/** True when heavy pointer effects should run (fine pointer, motion allowed). */
export function richPointer() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Ask every R3F canvas to re-measure once a layout-affecting animation has settled. */
export function remeasureCanvases() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("resize"));
}
