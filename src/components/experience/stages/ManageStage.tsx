import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, CheckCircle2, Info, Lightbulb, RefreshCw } from "lucide-react";
import { categories } from "@/data/investments";
import { checkInAdvice, rupees, simulateHoldings } from "@/calculations/finance";
import { Money, StageHeading } from "../Controls";
import type { JourneyState } from "./types";

const CHECKPOINTS = [
  { months: 6, label: "6 months" },
  { months: 12, label: "1 year" },
  { months: 24, label: "2 years" },
  { months: 36, label: "3 years" },
  { months: 60, label: "5 years" },
  { months: 84, label: "7 years" },
];

function statusOf(i: number, value: number, contributed: number) {
  if (contributed <= 0) return { word: "Not started", tone: "muted" };
  if (i < 2) return { word: "Steady", tone: "steady" };
  const change = value / contributed - 1;
  if (change < -0.02) return { word: "Down for now", tone: "down" };
  if (change > 0.02) return { word: "Growing", tone: "up" };
  return { word: "About even", tone: "steady" };
}

/**
 * A calm check-in: one headline, a simple list of what you hold, and at most two things to consider.
 * Uses a simulated bumpy year-by-year path (not the smooth line from Time travel), so dips appear.
 */
export function ManageStage({ s }: { s: JourneyState }) {
  const [at, setAt] = useState(2);
  const months = CHECKPOINTS[at]?.months ?? 24;
  const holdings = useMemo(() => simulateHoldings(s.amounts, months), [s.amounts, months]);
  const value = holdings.reduce((t, h) => t + h.value, 0);
  const contributed = holdings.reduce((t, h) => t + h.contributed, 0);
  const diff = value - contributed;
  const advice = checkInAdvice(s.amounts, holdings, s.expense * 6);
  const biggest = Math.max(1, ...holdings.map((h) => h.value));

  return (
    <>
      <StageHeading
        number="06"
        eyebrow="Manage over time"
        title="Check in, don’t check constantly."
        description="Pick a check-in. See what you hold and how it’s doing in plain words, plus the one thing worth doing next."
      />
      <div className="checkin-picker" role="tablist" aria-label="Check-in point">
        {CHECKPOINTS.map((c, i) => (
          <button
            key={c.label}
            role="tab"
            aria-selected={at === i}
            className={at === i ? "is-selected" : ""}
            onClick={() => setAt(i)}
          >
            {at === i && <motion.span layoutId="checkin-pill" className="question-pill" />}
            <span>{c.label}</span>
          </button>
        ))}
      </div>
      <div className="manage-layout">
        <section className="holdings">
          <div className="holdings-headline">
            <span>Everything you hold after {CHECKPOINTS[at]?.label}</span>
            <Money value={value} />
            <p className={diff >= 0 ? "is-up" : "is-down"}>
              You put in {rupees(contributed)}.{" "}
              {diff >= 0
                ? `It has grown by ${rupees(diff)}.`
                : `It is ${rupees(-diff)} below that right now, a normal dip.`}
            </p>
          </div>
          <ul className="holding-list">
            {categories.map((cat, i) => {
              const h = holdings[i]!;
              const st = statusOf(i, h.value, h.contributed);
              return (
                <li key={cat} className={`legend-${i}`}>
                  <div className="holding-top">
                    <span>
                      <i />
                      {cat}
                    </span>
                    <strong>{rupees(h.value)}</strong>
                  </div>
                  <span className="holding-bar">
                    <motion.i
                      initial={false}
                      animate={{ width: `${(h.value / biggest) * 100}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    />
                  </span>
                  <span className={`holding-status status-${st.tone}`}>{st.word}</span>
                </li>
              );
            })}
          </ul>
          <p className="fine-print">
            <Info size={12} /> Simulated, bumpy year-by-year returns (including down years) for
            illustration. Not historical data, not a forecast.
          </p>
        </section>

        <aside className="checkin">
          <h2>
            <CalendarCheck size={22} /> This check-in
          </h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${at}-${advice.map((x) => x.title).join()}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {advice.map((item) => (
                <div key={item.title} className={`advice advice-${item.tone}`}>
                  {item.tone === "calm" ? (
                    <CheckCircle2 size={18} />
                  ) : item.tone === "act" ? (
                    <RefreshCw size={18} />
                  ) : (
                    <Lightbulb size={18} />
                  )}
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
          <div className="habits">
            <h3>Good habits</h3>
            <ul>
              <li>Check every 6–12 months, not every day. Daily prices are noise.</li>
              <li>Rebalance with new money first, before selling anything.</li>
              <li>Raise your SIP a little whenever your income rises.</li>
              <li>Revisit the plan when life changes: a job, a loan, a family need.</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
