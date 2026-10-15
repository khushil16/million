import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowRight, ShieldCheck, Orbit, CircleHelp, X, Sparkles, LineChart } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { Universe } from "@/components/universe/Universe";
import { CosmicBackdrop } from "@/components/fx/CosmicBackdrop";
import { ClickFeedback } from "@/components/fx/CursorFX";
import { fx, remeasureCanvases } from "@/components/fx/fxBus";
import {
  DEFAULT_GOAL,
  DEFAULT_MONTHLY,
  duration,
  monthsToGoal,
  rupees,
} from "@/calculations/finance";
import { stages } from "@/data/investments";
import { Journey } from "./Journey";

/** Root of the experience: persistent 3D backdrop, with a warp transition between the two views. */
export function Home() {
  const [view, setView] = useState<"home" | "journey">("home");
  const reduced = useReducedMotion();
  function go(next: "home" | "journey") {
    if (next === view) return;
    fx.emit("warp", { strength: 1, direction: next === "journey" ? 1 : -1 });
    setView(next);
    window.scrollTo(0, 0);
  }
  const enter = {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    transitionEnd: { filter: "none" },
  } as const;
  return (
    <>
      <CosmicBackdrop />
      <ClickFeedback />
      <div className="app-layer">
        <AnimatePresence mode="wait" initial={false}>
          {view === "journey" ? (
            <motion.div
              key="journey"
              onAnimationComplete={remeasureCanvases}
              initial={reduced ? false : { opacity: 0, filter: "blur(12px)" }}
              animate={enter}
              exit={
                reduced ? {} : { opacity: 0, filter: "blur(10px)", transition: { duration: 0.4 } }
              }
            >
              <Journey onHome={() => go("home")} />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              onAnimationComplete={remeasureCanvases}
              initial={reduced ? false : { opacity: 0, filter: "blur(12px)" }}
              animate={enter}
              exit={
                reduced ? {} : { opacity: 0, filter: "blur(12px)", transition: { duration: 0.45 } }
              }
            >
              <HomeView onBegin={() => go("journey")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

const letter: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.2 + i * 0.025, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};
function Letters({ text, offset }: { text: string; offset: number }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          className="hero-letter"
          variants={letter}
          initial="hidden"
          animate="show"
          custom={offset + i}
          aria-hidden="true"
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </>
  );
}

function HomeView({ onBegin }: { onBegin: () => void }) {
  const [about, setAbout] = useState(false);
  const [fact, setFact] = useState(-1);
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLElement>(null);
  const facts = useMemo(
    () => [
      `${rupees(DEFAULT_MONTHLY)} a month is ${rupees(DEFAULT_MONTHLY * 12)} a year, before any growth.`,
      `Saving alone, with zero growth, reaches ${rupees(DEFAULT_GOAL)} in ${duration(monthsToGoal(DEFAULT_MONTHLY, 0))}.`,
      `At a hypothetical 8% a year it could take about ${duration(monthsToGoal(DEFAULT_MONTHLY, 0.08))}. Not a promise.`,
      "Some years lose money. A good plan is one you can keep through those years too.",
    ],
    [],
  );
  useEffect(() => {
    if (!about) return;
    const previous = document.activeElement;
    function trap(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAbout(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex="0"]',
      );
      const first = els?.[0],
        last = els?.[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [about]);
  const begin = () => {
    setAbout(false);
    onBegin();
  };
  const nextFact = () => setFact((f) => (f + 1) % facts.length);
  return (
    <div className="home-page">
      <header className="app-nav">
        <div className="wordmark">
          MILLION <span>/</span> ONE
        </div>
        <nav className="home-nav">
          <Button variant="ghost" className="nav-link" onClick={begin}>
            The journey
          </Button>
          <Button variant="ghost" className="nav-link" onClick={() => setAbout(true)}>
            How it works
          </Button>
        </nav>
        <Button variant="outline" className="nav-start" onClick={begin}>
          Start <ArrowRight size={15} />
        </Button>
      </header>
      <main>
        <section className="hero">
          <Universe onOrbClick={nextFact} />
          <div className="hero-atmosphere" />
          <div className="hero-content">
            <h1 aria-label="One goal. A million possibilities.">
              {reduced ? (
                <>
                  ONE GOAL.
                  <br />
                  <span>A MILLION</span>
                  <br />
                  <em>POSSIBILITIES.</em>
                </>
              ) : (
                <>
                  <span className="hero-line">
                    <Letters text="ONE GOAL." offset={0} />
                  </span>
                  <br />
                  <span className="hero-line">
                    <Letters text="A MILLION" offset={9} />
                  </span>
                  <br />
                  <em className="hero-line">
                    <Letters text="POSSIBILITIES." offset={18} />
                  </em>
                </>
              )}
            </h1>
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <p className="hero-description">
                Your first investment plan starts with understanding, not guessing.
              </p>
              <div className="starting-context">
                <div>
                  <span>Each month</span>
                  <strong>₹8,000</strong>
                </div>
                <div>
                  <span>Goal</span>
                  <strong>₹10,00,000</strong>
                </div>
                <div>
                  <span>Experience</span>
                  <strong>First-time investor</strong>
                </div>
              </div>
              <div className="hero-actions">
                <Button variant="journey" size="lg" onClick={begin} data-burst="big">
                  Begin my journey <ArrowRight size={17} />
                </Button>
              </div>
              <p className="hero-trust">
                <ShieldCheck size={15} />
                No perfect picks. No promised returns. Just a clearer plan.
              </p>
            </motion.div>
          </div>
          <div className="planet-label">
            <strong>₹10,00,000</strong>
            <AnimatePresence mode="wait">
              <motion.p
                key={fact}
                className="planet-fact"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                aria-live="polite"
              >
                {fact >= 0 ? facts[fact] : "A possibility, not a promise."}
              </motion.p>
            </AnimatePresence>
            <button className="orb-hint" onClick={nextFact}>
              {fact < 0
                ? "Tap the gold sphere for a quick fact"
                : `Fact ${fact + 1} of ${facts.length} · next`}
            </button>
          </div>
        </section>
        <section className="journey-preview">
          <motion.div
            className="preview-intro"
            initial={reduced ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7 }}
          >
            <h2>
              A big future.
              <br />
              <em>{stages.length} small steps.</em>
            </h2>
            <p>You don’t need to know everything. Just what matters for your next step.</p>
          </motion.div>
          <div className="preview-steps">
            {[
              {
                number: "1",
                name: "Understand the options",
                text: "What each one is, in plain words.",
                icon: Orbit,
              },
              {
                number: "2–3",
                name: "Find your balance",
                text: "Your comfort, your monthly plan, your risk.",
                icon: ShieldCheck,
              },
              {
                number: "4–5",
                name: "Test it",
                text: "Travel through time. Survive a market crash.",
                icon: Sparkles,
              },
              {
                number: "6–7",
                name: "Keep it going",
                text: "Check in over time. Take your plan with you.",
                icon: LineChart,
              },
            ].map((s, i) => (
              <motion.div
                key={s.number}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Button variant="ghost" className="preview-step" onClick={begin}>
                  <span className="preview-step-number">{s.number}</span>
                  <s.icon size={22} />
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.text}</small>
                  </span>
                  <ArrowRight size={16} />
                </Button>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <footer className="home-footer">
        <p>The Honest Million · An educational simulation. Not financial advice.</p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="How this simulation works"
          title="How this simulation works"
          onClick={() => setAbout(true)}
        >
          <CircleHelp size={18} />
        </Button>
      </footer>
      <AnimatePresence>
        {about && (
          <motion.div
            className="modal-backdrop"
            onClick={() => setAbout(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              ref={dialogRef}
              className="philosophy-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="philosophy-title"
              onClick={(e) => e.stopPropagation()}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? {} : { opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <Button
                autoFocus
                variant="ghost"
                size="icon"
                className="modal-close"
                aria-label="Close"
                onClick={() => setAbout(false)}
              >
                <X size={18} />
              </Button>
              <h2 id="philosophy-title">How this works</h2>
              <p>
                MILLION / ONE turns too many options into one considered beginning, for a first-time
                investor in India.
              </p>
              <p>
                Every number is a local, deterministic simulation: no live market data, no
                guaranteed returns, no accounts. Your choices last for this visit; download your
                roadmap to keep them.
              </p>
              <p>
                The ₹10,00,000 goal is ten lakh rupees. Taxes, fees and inflation are left out of
                the illustrations.
              </p>
              <Button onClick={begin}>
                Find my first step <ArrowRight size={16} />
              </Button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
