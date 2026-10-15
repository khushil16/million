import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, TrendingDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Universe } from "@/components/universe/Universe";
import { fx } from "@/components/fx/fxBus";
import {
  DEFAULT_GOAL,
  duration,
  monthsToGoal,
  monthsToGoalWithShock,
  project,
  projectWithShock,
  rupees,
} from "@/calculations/finance";
import { Money, Range, StageHeading } from "../Controls";
import type { JourneyActions, JourneyState } from "./types";

const MAX_YEARS = 20;

export function TimelineStage({ s, a }: { s: JourneyState; a: JourneyActions }) {
  const [year, setYear] = useState(5);
  const [playing, setPlaying] = useState(false);
  const [crashOn, setCrashOn] = useState(false);
  const [crashYear, setCrashYear] = useState(4);
  const r = s.rate / 100;
  const shock = crashOn ? (s.decline / 100) * s.risk.investedMarketShare : 0;
  const shockMonth = crashYear * 12;
  const months = Math.round(year * 12);

  const calm = project(s.invested, r, months);
  const shown = crashOn ? projectWithShock(s.invested, r, months, shockMonth, shock) : calm;
  const crashHappened = crashOn && months > shockMonth;
  const calmGoal = monthsToGoal(s.invested, r);
  const goal = crashOn ? monthsToGoalWithShock(s.invested, r, shockMonth, shock) : calmGoal;
  const delay = goal !== null && calmGoal !== null ? goal - calmGoal : null;

  const milestones = useMemo(
    () =>
      [
        { value: 250_000, label: "₹2.5 lakh" },
        { value: 500_000, label: "₹5 lakh" },
        { value: DEFAULT_GOAL, label: "₹10 lakh goal" },
      ]
        .map((m) => ({
          ...m,
          months: crashOn
            ? monthsToGoalWithShock(s.invested, r, shockMonth, shock, m.value)
            : monthsToGoal(s.invested, r, m.value),
        }))
        .filter(
          (m): m is typeof m & { months: number } =>
            m.months !== null && m.months <= MAX_YEARS * 12,
        )
        .map((m) => ({ t: m.months / 12 / MAX_YEARS, label: m.label })),
    [s.invested, r, crashOn, shockMonth, shock],
  );

  // celebrate passing a milestone; flash when travelling through the crash
  const passed = milestones.filter((m) => year / MAX_YEARS >= m.t - 1e-3).length;
  const prevPassed = useRef(passed);
  const prevCrash = useRef(crashHappened);
  useEffect(() => {
    if (passed > prevPassed.current) fx.burstAt(document.querySelector(".timeline-value"), 1.1);
    prevPassed.current = passed;
  }, [passed]);
  useEffect(() => {
    if (crashHappened && !prevCrash.current) fx.emit("flash");
    prevCrash.current = crashHappened;
  }, [crashHappened]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      last = performance.now();
    const end = Math.min(MAX_YEARS, goal !== null ? Math.ceil(goal / 12) + 1 : MAX_YEARS);
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      setYear((y) => {
        const next = Math.min(end, y + dt * 2.4);
        if (next >= end) setPlaying(false);
        return Math.round(next * 10) / 10;
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, goal]);

  const growthShare = shown.balance > 0 ? Math.max(0, shown.growth) / shown.balance : 0;
  const crashLoss = calm.balance - shown.balance;

  return (
    <>
      <StageHeading
        number="04"
        eyebrow="Travel through time"
        title="Meet your possible future."
        description="Drag along the gold path or press play. Then add a market crash to see what a bad year does to the same plan."
      />
      <div className="timeline-layout">
        <div className={`timeline-visual ${crashHappened ? "is-crashed" : ""}`}>
          <Universe
            mode="timeline"
            progress={year / MAX_YEARS}
            milestones={milestones}
            crash={
              crashOn ? { t: crashYear / MAX_YEARS, label: `Crash −${s.decline}%` } : undefined
            }
            onScrub={(t) => {
              setPlaying(false);
              setYear(Math.round(t * MAX_YEARS * 10) / 10);
            }}
          />
          <div className="timeline-value">
            <span>Year {year.toFixed(1)} · illustrative value</span>
            <Money value={shown.balance} />
            <span>
              {Math.min(100, Math.round((shown.balance / DEFAULT_GOAL) * 100))}% of your goal
              {crashHappened && crashLoss > 0 && (
                <em className="loss"> · {rupees(crashLoss)} lower after the crash</em>
              )}
            </span>
          </div>
          <div className="timeline-scrub">
            <Button
              variant="outline"
              size="icon"
              className="play-button"
              aria-label={playing ? "Pause" : "Play through the years"}
              onClick={() => {
                if (!playing && year >= MAX_YEARS - 0.1) setYear(0);
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Range
              label="Year"
              value={year}
              max={MAX_YEARS}
              step={0.1}
              onChange={(n) => {
                setPlaying(false);
                setYear(n);
              }}
              display={`Year ${year.toFixed(1)}`}
            />
          </div>
        </div>

        <section className="timeline-controls">
          <div
            className="split-bar"
            role="img"
            aria-label={`Contributions ${Math.round((1 - growthShare) * 100)}%, growth ${Math.round(growthShare * 100)}%`}
          >
            <motion.span className="split-bar-contrib" animate={{ flexGrow: 1 - growthShare }} />
            <motion.span className="split-bar-growth" animate={{ flexGrow: growthShare }} />
          </div>
          <div className="figure-row">
            <span>
              <i className="dot dot-contrib" /> You put in
            </span>
            <Money value={shown.contributed} />
          </div>
          <div className={`figure-row ${shown.growth < 0 ? "is-negative" : "growth"}`}>
            <span>
              <i className="dot dot-growth" />{" "}
              {shown.growth < 0 ? "Hypothetical loss" : "Hypothetical growth"}
            </span>
            <Money value={Math.abs(shown.growth)} />
          </div>
          <div className="figure-row">
            <span>Still to go</span>
            <Money value={Math.max(0, DEFAULT_GOAL - shown.balance)} />
          </div>

          <div className={`crash-panel ${crashOn ? "is-on" : ""}`}>
            <div className="crash-head">
              <TrendingDown size={18} />
              <div>
                <strong>What if markets crash?</strong>
                <span>
                  Only the market-linked {Math.round(s.risk.investedMarketShare * 100)}% of your
                  invested money falls.
                </span>
              </div>
              <Button
                variant={crashOn ? "outline" : "default"}
                size="sm"
                onClick={() => setCrashOn(!crashOn)}
                aria-pressed={crashOn}
              >
                <Zap size={14} /> {crashOn ? "Remove crash" : "Add a crash"}
              </Button>
            </div>
            <AnimatePresence initial={false}>
              {crashOn && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="crash-body"
                >
                  <Range
                    label="Crash happens in year"
                    value={crashYear}
                    min={1}
                    max={15}
                    onChange={setCrashYear}
                    display={`Year ${crashYear}`}
                  />
                  <Range
                    label="Market fall"
                    value={s.decline}
                    min={10}
                    max={50}
                    step={5}
                    onChange={a.setDecline}
                    display={`−${s.decline}%`}
                    className="storm-range"
                  />
                  <p className="crash-result">
                    {shock === 0
                      ? "Your mix has no market-linked money, so a crash would not change this path."
                      : `Your invested balance drops ${Math.round(shock * 100)}% in year ${crashYear}. `}
                    {shock > 0 && delay !== null && (
                      <strong>
                        {delay > 0
                          ? `The goal arrives ${duration(delay)} later.`
                          : "The goal date barely moves."}
                      </strong>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Range
            label="Hypothetical yearly growth"
            value={s.rate}
            min={0}
            max={15}
            step={0.5}
            onChange={a.setRate}
            display={`${s.rate}%`}
          />
          <div className="goal-estimate">
            <span>Illustrative time to ₹10,00,000{crashOn ? ", with the crash" : ""}</span>
            <strong>{duration(goal)}</strong>
          </div>
          <p className="fine-print">
            Contributions at month end, monthly compounding, one constant growth rate. Real markets
            are bumpier than this path. Fees, taxes and inflation excluded.
          </p>
        </section>
      </div>
    </>
  );
}
