import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  LifeBuoy,
  PiggyBank,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Universe } from "@/components/universe/Universe";
import { fx } from "@/components/fx/fxBus";
import { lossToolkit, responseCopy } from "@/data/advice";
import { duration, rupees, stormResponses } from "@/calculations/finance";
import { Money, Range, Reveal, StageHeading } from "../Controls";
import type { JourneyActions, JourneyState } from "./types";

const toolkitIcons = [LifeBuoy, ShieldCheck, PiggyBank, Check];

/** Full-page lightning: a flash over the whole viewport plus a freshly drawn bolt each strike. */
export function StormSky({ active }: { active: boolean }) {
  const [strike, setStrike] = useState<{ id: number; d: string; branch: string } | null>(null);
  useEffect(() => {
    if (!active) {
      setStrike(null);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const draw = () => {
      const h = 1000;
      let x = 150 + Math.random() * 700,
        y = 0;
      const pts = [`M${x.toFixed(0)},0`];
      const branchAt = 3 + Math.floor(Math.random() * 3);
      let branch = "";
      for (let i = 0; i < 11; i++) {
        x += (Math.random() - 0.5) * 120;
        y += h * (0.04 + Math.random() * 0.05);
        pts.push(`L${x.toFixed(0)},${y.toFixed(0)}`);
        if (i === branchAt) {
          let bx = x,
            by = y;
          const b = [`M${bx.toFixed(0)},${by.toFixed(0)}`];
          for (let k = 0; k < 5; k++) {
            bx += (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 60);
            by += h * 0.04;
            b.push(`L${bx.toFixed(0)},${by.toFixed(0)}`);
          }
          branch = b.join(" ");
        }
      }
      setStrike({ id: Date.now(), d: pts.join(" "), branch });
    };
    const first = window.setTimeout(draw, 80); // strike as the storm begins
    const off = fx.on("flash", draw);
    return () => {
      window.clearTimeout(first);
      off();
    };
  }, [active]);
  if (!active) return null;
  return (
    <div className="storm-sky" aria-hidden="true">
      <div className="storm-tint" />
      {strike && (
        <div key={strike.id} className="storm-strike">
          <div className="storm-flash" />
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path d={strike.d} className="bolt-glow" />
            <path d={strike.d} className="bolt" />
            <path d={strike.branch} className="bolt bolt-branch" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function StormStage({
  s,
  a,
  onReview,
}: {
  s: JourneyState;
  a: JourneyActions;
  onReview: () => void;
}) {
  const [choice, setChoice] = useState<"stay" | "pause" | "sell" | null>(null);
  const r = s.rate / 100;
  const marketPart = s.yearFive * s.risk.investedMarketShare;
  const steadyPart = s.yearFive - marketPart;
  const cashPart = (s.amounts[0] ?? 0) * 60;
  const hitPct = s.yearFive > 0 ? s.stormHit.lost / s.yearFive : 0;
  const responses = stormResponses(s.stormHit.remaining, s.invested, r);
  const stay = responses[0]!;
  const picked = responses.find((x) => x.id === choice);
  const total = Math.max(1, marketPart + steadyPart + cashPart);

  function toggle(e: React.MouseEvent) {
    const next = !s.storm;
    a.setStorm(next);
    setChoice(null);
    if (next) {
      fx.emit("flash");
      fx.emit("burst", { x: e.clientX, y: e.clientY, strength: 1.6, color: "storm" });
    }
  }

  return (
    <>
      <StageHeading
        number="05"
        eyebrow="The market storm"
        title={s.storm ? "The orbit shifts. Not the purpose." : "A crash, before it’s real."}
        description="Markets fall sometimes, often sharply. Practise it here at year five, see what it actually hits, and choose how you'd respond."
      />
      <div className={`storm-layout ${s.storm ? "storm-active" : ""}`}>
        <div className="storm-visual">
          <Universe mode={s.storm ? "storm" : "timeline"} progress={0.25} />
          <div className="storm-value">
            <span>{s.storm ? "After the fall" : "Your invested money at year 5"}</span>
            <Money value={s.storm ? s.stormHit.remaining : s.yearFive} />
            {s.storm && (
              <motion.span
                className="loss"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                −{rupees(s.stormHit.lost)} · {(hitPct * 100).toFixed(1)}% of your plan
              </motion.span>
            )}
          </div>
        </div>

        <section className="storm-controls">
          <Range
            label="How far markets fall"
            value={s.decline}
            min={10}
            max={50}
            step={5}
            onChange={a.setDecline}
            display={`−${s.decline}%`}
            className="storm-range"
          />
          <Button
            className={`wide-button storm-button ${s.storm ? "" : "is-armed"}`}
            variant={s.storm ? "outline" : "default"}
            onClick={toggle}
          >
            {s.storm ? <RotateCcw size={16} /> : <Zap size={16} />}{" "}
            {s.storm ? "Back to calm" : "Start the storm"}
          </Button>

          {s.storm && (
            <Reveal>
              <div className="hit-map">
                <h3>What the fall actually hit</h3>
                <div
                  className="hit-bar"
                  role="img"
                  aria-label="Breakdown of what fell and what stayed safe"
                >
                  <span
                    className="hit-safe"
                    style={{ flexGrow: cashPart / total }}
                    title="Emergency cash"
                  />
                  <span
                    className="hit-steady"
                    style={{ flexGrow: steadyPart / total }}
                    title="Fixed deposits"
                  />
                  <span
                    className="hit-market"
                    style={{ flexGrow: (marketPart - s.stormHit.lost) / total }}
                    title="Market money left"
                  />
                  <motion.span
                    className="hit-lost"
                    initial={{ flexGrow: 0 }}
                    animate={{ flexGrow: s.stormHit.lost / total }}
                    transition={{ type: "spring", stiffness: 90, damping: 16 }}
                    title="Fall"
                  />
                </div>
                <ul className="hit-legend">
                  <li className="hit-safe">
                    <i /> Emergency cash <strong>{rupees(cashPart)} · untouched</strong>
                  </li>
                  <li className="hit-steady">
                    <i /> Fixed deposits <strong>{rupees(steadyPart)} · untouched</strong>
                  </li>
                  <li className="hit-lost">
                    <i /> Index funds &amp; gold{" "}
                    <strong>
                      −{rupees(s.stormHit.lost)} ({s.decline}%)
                    </strong>
                  </li>
                </ul>
                <p>
                  A {s.decline}% market fall cut your invested money by {(hitPct * 100).toFixed(1)}
                  %, because only {Math.round(s.risk.investedMarketShare * 100)}% of it was
                  market-linked. Getting back to {rupees(s.yearFive)} needs a{" "}
                  {(((s.stormHit.recoveryGain ?? 0) || 0) * 100).toFixed(1)}% rise, without new
                  contributions.
                </p>
              </div>

              <div className="response">
                <h3>What would you do?</h3>
                <div
                  className="response-options"
                  role="radiogroup"
                  aria-label="Your response to the fall"
                >
                  {responses.map((resp) => {
                    const copy = responseCopy[resp.id];
                    return (
                      <button
                        key={resp.id}
                        type="button"
                        role="radio"
                        aria-checked={choice === resp.id}
                        className={`response-option response-${resp.id} ${choice === resp.id ? "is-selected" : ""}`}
                        onClick={() => setChoice(resp.id)}
                      >
                        <strong>{copy.label}</strong>
                        <span>{copy.detail}</span>
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence mode="wait">
                  {picked && (
                    <motion.div
                      key={picked.id}
                      className={`response-outcome outcome-${picked.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <div className="outcome-figures">
                        <div>
                          <span>3 years later</span>
                          <strong>{rupees(picked.value)}</strong>
                        </div>
                        <div>
                          <span>Reach ₹10 lakh in</span>
                          <strong>{duration(picked.months)}</strong>
                        </div>
                      </div>
                      {picked.id !== "stay" && (
                        <p className="outcome-compare">
                          {rupees(stay.value - picked.value)} less than staying the course
                          {picked.months !== null &&
                          stay.months !== null &&
                          picked.months > stay.months
                            ? `, and ${duration(picked.months - stay.months)} later to the goal`
                            : ""}
                          .
                        </p>
                      )}
                      <p>{responseCopy[picked.id].lesson}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!picked && <p className="fine-print">Pick one to see where it leads.</p>}
              </div>

              <div className="toolkit">
                <h3>
                  <TrendingDown size={16} /> Managing a loss
                </h3>
                <ul>
                  {lossToolkit.map((t, i) => {
                    const Icon = toolkitIcons[i] ?? Check;
                    return (
                      <li key={t.title}>
                        <Icon size={18} />
                        <div>
                          <strong>{t.title}</strong>
                          <p>{t.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <Button variant="ghost" onClick={onReview}>
                Review my mix <ArrowRight size={16} />
              </Button>
            </Reveal>
          )}
          <p className="fine-print">
            A simplified stress test: the fall applies to index funds and gold only. Outcomes use
            your {s.rate}% hypothetical rate for all choices (selling assumes 3% in savings). Not a
            prediction.
          </p>
        </section>
      </div>
    </>
  );
}
