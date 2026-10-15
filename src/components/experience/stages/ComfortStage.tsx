import { AnimatePresence, motion } from "motion/react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { presets } from "@/data/investments";
import { Money, Range, StageHeading } from "../Controls";
import { AmountField, Question } from "./shared";
import type { JourneyActions, JourneyState } from "./types";

export function ComfortStage({ s, a }: { s: JourneyState; a: JourneyActions }) {
  const tol =
    s.tolerance === "I’d sell immediately" ? 0.15 : s.tolerance === "I’d feel uneasy" ? 0.5 : 0.85;
  const room = Math.round(((tol + Math.min(1, s.horizon / 15)) / 2) * 100);
  const roomLabel =
    room < 35
      ? "Little room for swings"
      : room < 65
        ? "Some room for swings"
        : "More room for swings";
  const suggested = presets[s.suggestion.preset];
  return (
    <>
      <StageHeading
        number="02"
        eyebrow="Your comfort zone"
        title="Your peace of mind comes first."
        description="Four quick questions. Your answers shape the mix we suggest next. There are no wrong answers."
      />
      <div className="comfort-layout">
        <section className="question-panel">
          <Range
            label="When might you need this money?"
            value={s.horizon}
            min={1}
            max={20}
            onChange={a.setHorizon}
            display={`In ${s.horizon} year${s.horizon === 1 ? "" : "s"}`}
          />
          <Question
            title="Your emergency savings today"
            options={["Starting from zero", "1–3 months of expenses", "6+ months of expenses"]}
            value={s.emergency}
            onChange={a.setEmergency}
          />
          <Question
            title="Who depends on your income?"
            options={["Just my own expenses", "I help my family", "I have debt repayments"]}
            value={s.responsibility}
            onChange={a.setResponsibility}
          />
          <Question
            title="If ₹1,00,000 dropped to ₹75,000, you would…"
            options={["I’d sell immediately", "I’d feel uneasy", "I could wait and review"]}
            value={s.tolerance}
            onChange={a.setTolerance}
          />
        </section>
        <aside className="comfort-insight">
          <ShieldCheck size={32} />
          <h2>A safety net before a leap.</h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={s.emergency}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {s.emergency === "Starting from zero"
                ? "Build emergency savings first. Money you may need soon should never depend on the market recovering."
                : "Keep your emergency savings separate from investments, so a market fall never forces you to sell."}
            </motion.p>
          </AnimatePresence>
          <AmountField
            label="Your essential monthly expenses"
            value={s.expense}
            onChange={a.setExpense}
            max={100000}
          />
          <div className="insight-target">
            <span>Six-month safety net</span>
            <strong>
              <Money value={s.expense * 6} />
            </strong>
          </div>
          <div className="room-meter" role="img" aria-label={roomLabel}>
            <span>
              <span>Room for market swings</span>
              <strong>{roomLabel}</strong>
            </span>
            <span className="room-track">
              <motion.i
                animate={{ width: `${room}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </span>
          </div>
          {suggested && (
            <div className="suggest-preview">
              <Sparkles size={16} />
              <span>
                From your answers we’ll suggest <strong>{suggested.name}</strong> on the next step.
              </span>
            </div>
          )}
          {s.horizon < 5 && (
            <p className="warning">
              A short horizon leaves little time to recover from share-market losses.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
