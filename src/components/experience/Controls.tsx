import { motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { rupees } from "@/calculations/finance";
import { remeasureCanvases } from "@/components/fx/fxBus";

export function Money({ value, className = "" }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      shownRef.current = value;
      return;
    }
    const from = shownRef.current,
      start = performance.now();
    let frame = 0;
    function tick(now: number) {
      const t = Math.min((now - start) / 450, 1);
      const v = from + (value - from) * (1 - Math.pow(1 - t, 3));
      shownRef.current = v;
      setShown(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <span className={`money ${className}`}>{rupees(shown)}</span>;
}

export function Range({
  label,
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  display,
  className = "",
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  display?: string;
  className?: string;
}) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label
      className={`range-control ${className}`}
      style={{ "--fill": `${fill}%` } as CSSProperties}
    >
      <span className="range-heading">
        <span>{label}</span>
        <strong>{display ?? value}</strong>
      </span>
      <input
        type="range"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        data-cursor="Drag"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="range-extents">
        <span>{min}</span>
        <span>{max}</span>
      </span>
    </label>
  );
}

const headingWords: Variants = {
  hidden: { opacity: 0, y: "0.6em", rotateX: -60, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { delay: 0.08 + i * 0.055, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

/** Splits a headline into words that rise in one after another. */
export function SplitWords({ text, className = "" }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;
  return (
    <span className={`split-words ${className}`} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="split-word"
          aria-hidden="true"
          variants={headingWords}
          initial="hidden"
          animate="show"
          custom={i}
        >
          {w}&nbsp;
        </motion.span>
      ))}
    </span>
  );
}

export function StageHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="stage-heading">
      <div className="eyebrow">
        <span className="tiny-star">✦</span> {number} / {eyebrow}
      </div>
      <h1>
        <SplitWords key={title} text={title} />
      </h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
      >
        {description}
      </motion.p>
    </header>
  );
}

export function Reveal({ children, direction = 1 }: { children: ReactNode; direction?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="reveal-content"
      initial={reduced ? false : { opacity: 0, x: direction * 32, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      exit={reduced ? {} : { opacity: 0, x: direction * -20, filter: "blur(4px)" }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// No scale/rotate here: R3F measures canvas size on mount, and CSS transforms that change
// an element's box would leave the 3D canvas undersized with offset hit-testing.
const stageVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 80, filter: "blur(10px)" }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    transitionEnd: { filter: "none" },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -80,
    filter: "blur(10px)",
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
  }),
};

/** Directional, depth-aware stage change; pairs with the backdrop's warp streaks. */
export function StageTransition({
  children,
  direction,
}: {
  children: ReactNode;
  direction: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className="reveal-content">{children}</div>;
  return (
    <motion.div
      className="reveal-content stage-transition"
      custom={direction}
      variants={stageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      onAnimationComplete={remeasureCanvases}
    >
      {children}
    </motion.div>
  );
}

/** Five-segment relative meter with staggered fill. */
export function Meter({
  label,
  value,
  tone = "gold",
}: {
  label: string;
  value: number;
  tone?: "gold" | "cool";
}) {
  return (
    <div className={`meter meter-${tone}`} role="img" aria-label={`${label}: ${value} out of 5`}>
      <span className="meter-label">{label}</span>
      <span className="meter-cells">
        {Array.from({ length: 5 }, (_, i) => (
          <motion.i
            key={i}
            initial={{ scaleY: 0.2, opacity: 0.25 }}
            animate={{ scaleY: i < value ? 1 : 0.35, opacity: i < value ? 1 : 0.22 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 380, damping: 22 }}
          />
        ))}
      </span>
    </div>
  );
}
