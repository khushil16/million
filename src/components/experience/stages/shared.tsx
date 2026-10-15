import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RiskLevel } from "@/calculations/finance";

export function AmountField({
  label,
  value,
  onChange,
  max = 50000,
  step = 100,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  step?: number;
}) {
  return (
    <label className="amount-field">
      {label}
      <span>
        ₹
        <input
          aria-label={label}
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value))))}
        />
      </span>
    </label>
  );
}

const levelCopy: Record<RiskLevel, string> = {
  None: "Add amounts to see the risk.",
  Low: "Mostly steady money. Slow growth; inflation is the main risk.",
  Moderate: "A mix of steady and market money. Expect some down years.",
  High: "Mostly market money. Bigger swings, and you need years to recover.",
};

/** A single, labelled 0–100 risk bar with Low / Moderate / High zones. */
export function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  return (
    <div className={`risk-gauge risk-${level.toLowerCase()}`}>
      <div className="risk-gauge-head">
        <span>Risk level</span>
        <strong>{level}</strong>
      </div>
      <div
        className="risk-track"
        role="img"
        aria-label={`Risk level ${level}, ${score} out of 100`}
      >
        <span className="risk-zone" />
        <span className="risk-zone" />
        <span className="risk-zone" />
        <motion.i
          animate={{ left: `${Math.min(100, Math.max(0, score))}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
      </div>
      <div className="risk-scale">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
      </div>
      <p>{levelCopy[level]}</p>
    </div>
  );
}

export function Question({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="question">
      <legend>{title}</legend>
      <div>
        {options.map((o) => (
          <Button
            key={o}
            variant="outline"
            className={`question-option ${value === o ? "is-selected" : ""}`}
            aria-pressed={value === o}
            onClick={() => onChange(o)}
          >
            {value === o && (
              <motion.span
                layoutId={`q-${title}`}
                className="question-pill"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="question-label">
              {value === o && <Check size={14} />} {o}
            </span>
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
