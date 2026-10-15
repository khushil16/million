import { useState } from "react";
import { motion } from "motion/react";
import { Download, Info, RotateCcw, ShieldCheck, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fx } from "@/components/fx/fxBus";
import { allocationGuide, startingOrder } from "@/data/advice";
import { DEFAULT_GOAL, duration, monthsToGoal, rupees, SCENARIOS } from "@/calculations/finance";
import { Money, StageHeading } from "../Controls";
import { RiskGauge } from "./shared";
import type { JourneyState } from "./types";

export function SummaryStage({
  s,
  onRevisit,
  categories,
}: {
  s: JourneyState;
  onRevisit: () => void;
  categories: readonly string[];
}) {
  const [downloaded, setDownloaded] = useState(false);
  const cash = s.amounts[0] ?? 0;
  const target = s.expense * 6;
  const bufferMonths = cash > 0 ? Math.ceil(target / cash) : null;

  function download(e: React.MouseEvent) {
    const lines = [
      "MILLION / ONE — Educational personal roadmap",
      "",
      `Monthly amount: ${rupees(s.monthly)}`,
      ...categories.map(
        (c, i) => `  ${c}: ${rupees(s.amounts[i] ?? 0)}  (${allocationGuide[i]?.role})`,
      ),
      `  Not assigned: ${rupees(s.monthly - s.allocated)}`,
      "",
      `Goal: ${rupees(DEFAULT_GOAL)} · invested toward it: ${rupees(s.invested)}/month (emergency cash kept separate)`,
      `Illustrative time to goal at ${s.rate}%: ${duration(s.goalMonths)}`,
      ...SCENARIOS.map(
        (sc) => `  ${sc.name} (${sc.rate * 100}%): ${duration(monthsToGoal(s.invested, sc.rate))}`,
      ),
      "",
      `Risk level: ${s.risk.level} (${s.risk.score}/100). Market-linked share: ${Math.round(s.risk.marketShare * 100)}%.`,
      `In a bad year the invested part could fall about ${Math.round(s.risk.badYearFall * 100)}% (≈ ${rupees(s.yearFive * s.risk.badYearFall)} at year 5).`,
      `Emergency target: ${rupees(target)} (six months of essentials)${bufferMonths ? `, reached in about ${bufferMonths} months` : ""}.`,
      "",
      "Where and when:",
      ...allocationGuide.map((g, i) => `  ${categories[i]} — Where: ${g.where} When: ${g.when}`),
      "",
      "Order of steps:",
      ...startingOrder.map((o) => `  ${o.when}: ${o.what}`),
      "",
      `Your answers: ${s.horizon}-year horizon; ${s.emergency}; ${s.responsibility}; after a 25% fall: ${s.tolerance}.`,
      `Why this mix: ${s.presetInfo.rationale}`,
      "",
      "Assumptions: month-end contributions; monthly compounding from an effective annual rate; one constant hypothetical rate on invested money; bad-year falls of 35% (index funds) and 20% (gold) are simplified illustrations. No fees, taxes or inflation. Nothing here is guaranteed. Education, not personalised advice; consider a SEBI-registered investment adviser.",
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "million-one-roadmap.txt";
    link.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    fx.emit("burst", { x: e.clientX, y: e.clientY, strength: 2 });
  }

  return (
    <>
      <StageHeading
        number="07"
        eyebrow="Your personal plan"
        title="One goal. Your way forward."
        description="Everything you decided, in one place. Not a promise of a million; a clearer first step toward it."
      />
      <div className="summary-layout">
        <section className="roadmap-summary">
          <div className="summary-seal">
            <svg viewBox="0 0 34 34" aria-hidden="true">
              <motion.circle
                cx="17"
                cy="17"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
              <motion.path
                d="M10 17.5 L15 22 L24 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.9 }}
              />
            </svg>
            <span>Your plan</span>
          </div>
          <div className="summary-primary">
            <div>
              <span>Each month</span>
              <Money value={s.monthly} />
            </div>
            <div>
              <span>Illustrative time to goal</span>
              <strong>{duration(s.goalMonths)}</strong>
            </div>
          </div>
          <div className="summary-stack" aria-hidden="true">
            {categories.map((c, i) => (
              <motion.i
                key={c}
                className={`legend-${i}`}
                initial={{ flexGrow: 0 }}
                animate={{ flexGrow: s.monthly > 0 ? (s.amounts[i] ?? 0) / s.monthly : 0 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 90, damping: 18 }}
              />
            ))}
          </div>
          {categories.map((c, i) => (
            <div className={`summary-allocation legend-${i}`} key={c}>
              <span>
                <i />
                {c}
                <small>{allocationGuide[i]?.role}</small>
              </span>
              <strong>{rupees(s.amounts[i] ?? 0)}</strong>
            </div>
          ))}
          <p className="preset-rationale">{s.presetInfo.rationale}</p>

          <div className="summary-risk">
            <RiskGauge score={s.risk.score} level={s.risk.level} />
            <p className="loss-line">
              <TrendingDown size={16} />
              <span>
                A bad year could take about{" "}
                <strong className="loss">{Math.round(s.risk.badYearFall * 100)}%</strong> off your
                invested money for a while (≈ {rupees(s.yearFive * s.risk.badYearFall)} at year 5).
                Your emergency cash and deposits wouldn’t fall.
              </span>
            </p>
          </div>
          <p className="note">
            <ShieldCheck size={16} />
            Emergency target {rupees(target)}.{" "}
            {bufferMonths
              ? `At ${rupees(cash)}/month you reach it in about ${bufferMonths} months, then redirect that amount.`
              : "Add some emergency cash first."}
          </p>
          {s.unsuitable && (
            <p className="warning">
              Your mix may not match your comfort answers. Review the index-fund share before
              acting.
            </p>
          )}
          <Button onClick={download} data-burst="big">
            <Download size={16} />
            {downloaded ? "Download again" : "Download my roadmap"}
          </Button>
          {downloaded && (
            <p role="status" className="success-message">
              Saved: million-one-roadmap.txt
            </p>
          )}
        </section>
        <aside className="next-steps">
          <h2>When to do what</h2>
          <ol>
            {startingOrder.map((o, i) => (
              <motion.li
                key={o.when}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <span>{o.when}</span>
                <div>
                  <p>{o.what}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <p className="note">
            <Info size={16} />
            Before you invest, read each product’s terms and costs. For advice that fits your exact
            situation, speak to a SEBI-registered investment adviser.
          </p>
          <details>
            <summary>
              Calculation assumptions <Info size={14} />
            </summary>
            <p>
              {s.rate}% effective yearly hypothetical growth on {rupees(s.invested)} monthly
              invested, compounded monthly, contributions at month end. Emergency cash excluded from
              the goal. Other scenarios: 4% and 12%. Bad-year falls (35% index funds, 20% gold) are
              simplified illustrations. Fees, taxes, inflation and uneven real returns are excluded.
            </p>
          </details>
          <Button variant="outline" onClick={onRevisit}>
            <RotateCcw size={15} />
            Adjust my plan
          </Button>
        </aside>
      </div>
    </>
  );
}
