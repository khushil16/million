import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, Sparkles, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Universe } from "@/components/universe/Universe";
import { categories, presets } from "@/data/investments";
import { allocationGuide } from "@/data/advice";
import {
  BAD_YEAR_FALL,
  duration,
  monthsToGoal,
  rupees,
  SCENARIOS,
  setAllocation,
} from "@/calculations/finance";
import { Money, Range, StageHeading } from "../Controls";
import { AmountField, RiskGauge } from "./shared";
import type { JourneyActions, JourneyState } from "./types";

export function PlanStage({ s, a }: { s: JourneyState; a: JourneyActions }) {
  const reduced = useReducedMotion();
  const [highlight, setHighlight] = useState(-1);
  const [openGuide, setOpenGuide] = useState(-1);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const suggested = presets[s.suggestion.preset];
  const usingSuggestion = s.preset === s.suggestion.preset;
  const badYearLoss = s.yearFive * s.risk.badYearFall;

  function focusSegment(i: number) {
    setHighlight(i);
    const row = rows.current[i];
    if (!row) return;
    row.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    row.classList.remove("is-flashing");
    void row.offsetWidth;
    row.classList.add("is-flashing");
    row.querySelector("input")?.focus({ preventScroll: true });
  }

  return (
    <>
      <StageHeading
        number="03"
        eyebrow="Build your plan"
        title="Give every rupee a job."
        description="Start from the suggested mix, then adjust. Watch how risk and time to your goal change as you move each amount."
      />
      <div className="plan-layout">
        <section>
          {suggested && (
            <div className={`suggest-card ${usingSuggestion ? "is-applied" : ""}`}>
              <div className="suggest-head">
                <Sparkles size={18} />
                <div>
                  <span>Suggested for you</span>
                  <strong>{suggested.name}</strong>
                </div>
                {usingSuggestion ? (
                  <span className="suggest-applied">
                    <Check size={14} /> In use
                  </span>
                ) : (
                  <Button size="sm" onClick={() => a.choosePlan(s.suggestion.preset)}>
                    Use this mix
                  </Button>
                )}
              </div>
              <ul>
                {s.suggestion.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="fine-print">
                A common starting point for answers like yours, not personal advice.
              </p>
            </div>
          )}

          <AmountField label="Your monthly amount" value={s.monthly} onChange={a.changeMonthly} />
          <div className="preset-options" role="group" aria-label="Sample mixes">
            {presets.map((p, i) => (
              <Button
                key={p.name}
                variant="outline"
                className={s.preset === i ? "is-selected" : ""}
                onClick={() => a.choosePlan(i)}
              >
                {p.name}
              </Button>
            ))}
          </div>
          <p className="preset-rationale">{s.presetInfo.rationale}</p>

          {categories.map((cat, i) => (
            <div
              className={`allocation-row allocation-${i} ${highlight === i ? "is-highlighted" : ""}`}
              key={cat}
              ref={(el) => {
                rows.current[i] = el;
              }}
              onPointerEnter={() => setHighlight(i)}
              onPointerLeave={() => setHighlight(-1)}
            >
              <Range
                label={cat}
                value={s.amounts[i] ?? 0}
                max={s.monthly}
                step={100}
                display={rupees(s.amounts[i] ?? 0)}
                onChange={(n) => a.setAmounts(setAllocation(s.amounts, i, n, s.monthly))}
              />
              <p className="row-note">
                {allocationGuide[i]?.role}
                {(BAD_YEAR_FALL[i] ?? 0) > 0 ? (
                  <span className="row-risk">
                    Can fall ~{Math.round((BAD_YEAR_FALL[i] ?? 0) * 100)}% in a bad year
                  </span>
                ) : (
                  <span className="row-safe">Doesn’t fall with markets</span>
                )}
              </p>
            </div>
          ))}
          <div className="allocation-total">
            <span>Not yet assigned</span>
            <strong className={s.monthly - s.allocated > 0 ? "has-remainder" : ""}>
              <Money value={s.monthly - s.allocated} />
            </strong>
          </div>
          {s.monthly === 0 && <p className="warning">Add a monthly amount to begin.</p>}
          {s.unsuitable && (
            <p className="warning">
              Your index-fund share may not suit your short horizon or your answer about losses.
              Consider a calmer mix.
            </p>
          )}

          <section className="guide" aria-labelledby="guide-title">
            <h3 id="guide-title">Where and when to put each part</h3>
            {allocationGuide.map((g, i) => (
              <div
                key={g.role}
                className={`guide-item legend-${i} ${openGuide === i ? "is-open" : ""}`}
              >
                <button
                  type="button"
                  aria-expanded={openGuide === i}
                  onClick={() => setOpenGuide(openGuide === i ? -1 : i)}
                >
                  <i />
                  <span>
                    <strong>{categories[i]}</strong>
                    <small>{g.role}</small>
                  </span>
                  <ChevronDown size={16} />
                </button>
                <AnimatePresence initial={false}>
                  {openGuide === i && (
                    <motion.dl
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div>
                        <dt>Where</dt>
                        <dd>{g.where}</dd>
                      </div>
                      <div>
                        <dt>When</dt>
                        <dd>{g.when}</dd>
                      </div>
                      <div>
                        <dt>Risk</dt>
                        <dd>{g.risk}</dd>
                      </div>
                    </motion.dl>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </section>
        </section>

        <aside className="allocation-display">
          <Universe
            mode="allocation"
            amounts={s.amounts}
            labels={[...categories]}
            highlight={highlight}
            onSegment={focusSegment}
          />
          <div className="allocation-label">
            <span>Each month</span>
            <Money value={s.allocated} />
          </div>
          <div className="allocation-legend">
            {categories.map((cat, i) => (
              <button
                type="button"
                className={`legend-${i} ${highlight === i ? "is-active" : ""}`}
                key={cat}
                onClick={() => focusSegment(i)}
                onPointerEnter={() => setHighlight(i)}
                onPointerLeave={() => setHighlight(-1)}
              >
                <i />
                {cat}
              </button>
            ))}
          </div>

          <div className="risk-panel">
            <RiskGauge score={s.risk.score} level={s.risk.level} />
            <div className="risk-facts">
              <div>
                <span>Money that can fall with markets</span>
                <strong>{Math.round(s.risk.marketShare * 100)}%</strong>
              </div>
              <div className="loss-line">
                <TrendingDown size={18} />
                <p>
                  {s.risk.badYearFall > 0 ? (
                    <>
                      In a bad year, your invested money could drop about{" "}
                      <strong>{Math.round(s.risk.badYearFall * 100)}%</strong>. By year 5 that is
                      roughly <strong className="loss">{rupees(badYearLoss)}</strong> of{" "}
                      {rupees(s.yearFive)}, on paper, until markets recover.
                    </>
                  ) : (
                    <>
                      Nothing here falls with the market, but growth will be slow and may not beat
                      inflation.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="scenario-strip" aria-label="Illustrative time to ₹10 lakh">
            {SCENARIOS.map((sc) => (
              <div key={sc.name}>
                <span>
                  {sc.name} · {sc.rate * 100}%
                </span>
                <strong>{duration(monthsToGoal(s.invested, sc.rate))}</strong>
              </div>
            ))}
          </div>
          <p className="fine-print">
            Time to ₹10 lakh on {rupees(s.invested)}/month invested (emergency cash excluded).
            Hypothetical growth rates; bad-year falls are simplified assumptions, not forecasts.
          </p>
        </aside>
      </div>
    </>
  );
}
