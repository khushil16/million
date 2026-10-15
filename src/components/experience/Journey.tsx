import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowLeft, Check, ShieldCheck, Orbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fx } from "@/components/fx/fxBus";
import { categories, presets, stages } from "@/data/investments";
import {
  DEFAULT_MONTHLY,
  downturn,
  monthsToGoal,
  project,
  riskProfile,
  suggestMix,
} from "@/calculations/finance";
import { StageTransition } from "./Controls";
import type { JourneyState } from "./stages/types";
import { UnderstandStage } from "./stages/UnderstandStage";
import { ComfortStage } from "./stages/ComfortStage";
import { PlanStage } from "./stages/PlanStage";
import { TimelineStage } from "./stages/TimelineStage";
import { StormStage, StormSky } from "./stages/StormStage";
import { ManageStage } from "./stages/ManageStage";
import { SummaryStage } from "./stages/SummaryStage";

const NEXT_LABELS = [
  "Find my comfort zone",
  "Build my plan",
  "Travel through time",
  "Prepare for a storm",
  "Manage it over time",
  "See my personal plan",
];
const LAST = stages.length - 1;
const pad = (n: number) => String(n).padStart(2, "0");

export function Journey({ onHome }: { onHome: () => void }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0),
    [direction, setDirection] = useState(1),
    [visited, setVisited] = useState(0);
  const [selected, setSelected] = useState(0),
    [monthly, setMonthly] = useState(DEFAULT_MONTHLY),
    [amounts, setAmounts] = useState([2000, 2000, 3200, 800]),
    [preset, setPreset] = useState(1),
    [horizon, setHorizon] = useState(10),
    [emergency, setEmergency] = useState("Starting from zero"),
    [responsibility, setResponsibility] = useState("Just my own expenses"),
    [tolerance, setTolerance] = useState("I’d feel uneasy"),
    [rate, setRate] = useState(8),
    [expense, setExpense] = useState(6000),
    [storm, setStorm] = useState(false),
    [decline, setDecline] = useState(30);
  const celebrated = useRef(false);

  const allocated = amounts.reduce((a, b) => a + b, 0);
  const invested = allocated - (amounts[0] ?? 0);
  const risk = useMemo(() => riskProfile(amounts), [amounts]);
  const suggestion = useMemo(
    () => suggestMix({ horizon, emergency, responsibility, tolerance }),
    [horizon, emergency, responsibility, tolerance],
  );
  const yearFive = project(invested, rate / 100, 60).balance;
  // a market fall only hits the market-linked part of the invested money
  const stormHit = downturn(yearFive, (decline / 100) * risk.investedMarketShare);
  const currentPreset = presets[preset] ?? {
    name: "Your custom mix",
    shares: [],
    rationale:
      "Your own mix of accessible cash, deposits and market-linked investments. Check each amount fits your horizon and loss comfort; spreading money out does not prevent losses.",
  };

  const state: JourneyState = {
    monthly,
    amounts,
    preset,
    presetInfo: currentPreset,
    horizon,
    emergency,
    responsibility,
    tolerance,
    rate,
    expense,
    decline,
    storm,
    allocated,
    invested,
    risk,
    suggestion,
    yearFive,
    stormHit,
    goalMonths: monthsToGoal(invested, rate / 100),
    unsuitable:
      (horizon < 5 && (amounts[2] ?? 0) > 0) ||
      (tolerance === "I’d sell immediately" && (amounts[2] ?? 0) > monthly * 0.2),
  };
  const actions = {
    setSelected,
    setHorizon,
    setEmergency,
    setResponsibility,
    setTolerance,
    setRate,
    setExpense,
    setDecline,
    setStorm,
    setAmounts: (a: number[]) => {
      setPreset(-1);
      setAmounts(a);
    },
    changeMonthly(n: number) {
      if (!Number.isFinite(n)) return;
      const v = Math.max(0, Math.min(50000, Math.round(n)));
      setMonthly(v);
      const plan = presets[preset];
      if (plan) setAmounts(plan.shares.map((s) => Math.floor(s * v)));
      else {
        const total = amounts.reduce((a, b) => a + b, 0);
        if (total > v) setAmounts(amounts.map((a) => Math.floor((a / total) * v)));
      }
    },
    choosePlan(i: number) {
      const plan = presets[i];
      if (!plan) return;
      setPreset(i);
      setAmounts(plan.shares.map((s) => Math.floor(s * monthly)));
    },
  };

  const navigate = useCallback(
    (n: number) => {
      if (n < 0 || n > LAST || n === stage) return;
      setDirection(n > stage ? 1 : -1);
      fx.emit("warp", { strength: 0.45, direction: n > stage ? 1 : -1 });
      setStage(n);
      setVisited((v) => Math.max(v, n));
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    },
    [stage, reduced],
  );

  useEffect(() => {
    fx.emit("mood", stage === 4 && storm ? "storm" : "calm");
  }, [stage, storm]);
  useEffect(() => () => fx.emit("mood", "calm"), []);
  useEffect(() => {
    if (stage === LAST && !celebrated.current) {
      celebrated.current = true;
      if (!reduced) window.setTimeout(() => fx.emit("celebrate"), 450);
    }
  }, [stage, reduced]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (e.key === "ArrowRight") navigate(stage + 1);
      if (e.key === "ArrowLeft") navigate(stage - 1);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [stage, navigate]);

  return (
    <div className={`journey-page ${stage === 4 && storm ? "is-storm" : ""}`}>
      <StormSky active={stage === 4 && storm} />
      <header className="app-nav">
        <Button variant="ghost" className="wordmark" onClick={onHome}>
          MILLION <span>/</span> ONE
        </Button>
        <Button variant="outline" onClick={onHome}>
          Home <Orbit size={15} />
        </Button>
      </header>
      <nav className="journey-progress" aria-label="Journey stages">
        <span className="progress-rail" aria-hidden="true">
          <motion.span
            className="progress-rail-fill"
            animate={{ scaleX: visited / LAST }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </span>
        {stages.map((name, i) => (
          <Button
            key={name}
            variant="ghost"
            className={`progress-step ${stage === i ? "active" : ""} ${i < visited ? "completed" : ""}`}
            onClick={() => navigate(i)}
            aria-current={stage === i ? "step" : undefined}
          >
            <span className="step-number">
              {stage === i && <motion.span layoutId="step-glow" className="step-glow" />}
              {i < visited && stage !== i ? <Check size={12} /> : i + 1}
            </span>
            <span>{name}</span>
          </Button>
        ))}
      </nav>
      <main className="journey-main">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <StageTransition key={stage} direction={direction}>
            {stage === 0 && <UnderstandStage selected={selected} onSelect={setSelected} />}
            {stage === 1 && <ComfortStage s={state} a={actions} />}
            {stage === 2 && <PlanStage s={state} a={actions} />}
            {stage === 3 && <TimelineStage s={state} a={actions} />}
            {stage === 4 && <StormStage s={state} a={actions} onReview={() => navigate(2)} />}
            {stage === 5 && <ManageStage s={state} />}
            {stage === 6 && (
              <SummaryStage s={state} onRevisit={() => navigate(2)} categories={categories} />
            )}
          </StageTransition>
        </AnimatePresence>
        <footer className="stage-footer">
          <Button variant="ghost" onClick={() => (stage === 0 ? onHome() : navigate(stage - 1))}>
            <ArrowLeft size={16} />
            {stage === 0 ? "Home" : "Back"}
          </Button>
          <span className="stage-count">
            Step {pad(stage + 1)} of {pad(stages.length)}
          </span>
          {stage < LAST ? (
            <Button onClick={() => navigate(stage + 1)} className="next-button">
              {NEXT_LABELS[stage]}
              <ArrowRight size={16} />
            </Button>
          ) : (
            <span className="completion-note">
              <Check size={16} />A clearer beginning.
            </span>
          )}
        </footer>
      </main>
      <footer className="legal-footer">
        <ShieldCheck size={14} />
        Educational simulation. Not investment advice. Capital is at risk. No accounts or banking
        details needed.
      </footer>
    </div>
  );
}
