import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Gem, Info, Layers, Network, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Universe } from "@/components/universe/Universe";
import { investments, meterLabels } from "@/data/investments";
import { Meter, StageHeading } from "../Controls";

const icons = [ShieldCheck, Layers, Orbit, Network, Sparkles, Gem];

export function UnderstandStage({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  const reduced = useReducedMotion();
  const item = investments[selected] ?? investments[0]!;
  return (
    <>
      <StageHeading
        number="01"
        eyebrow="Understand"
        title="Find your place in the universe."
        description="Six common options. Tap one to see how it works, what can go wrong, and how easily you can get your money back."
      />
      <div className="understand-layout">
        <div className="station-visual">
          <Universe
            mode="stations"
            selected={selected}
            onSelect={onSelect}
            labels={investments.map((i) => i.short)}
          />
        </div>
        <div>
          <div className="instrument-tabs" role="tablist" aria-label="Investment options">
            {investments.map((inv, i) => {
              const Icon = icons[i] ?? Orbit;
              return (
                <Button
                  key={inv.name}
                  role="tab"
                  aria-selected={selected === i}
                  variant="ghost"
                  className={selected === i ? "is-selected" : ""}
                  onClick={() => onSelect(i)}
                >
                  {selected === i && (
                    <motion.span
                      layoutId="tab-pill"
                      className="tab-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={16} />
                  {inv.short}
                </Button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.article
              key={item.name}
              className="instrument-detail"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <div className="eyebrow">{item.type}</div>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <div className="meters">
                {meterLabels.map((m) => (
                  <Meter
                    key={m.key}
                    label={m.label}
                    value={item.meters[m.key]}
                    tone={m.key === "access" ? "cool" : "gold"}
                  />
                ))}
                <span className="meters-note">A simplified comparison: 1 = low, 5 = high.</span>
              </div>
              <dl>
                <div>
                  <dt>How it earns</dt>
                  <dd>{item.returns}</dd>
                </div>
                <div>
                  <dt>Risk</dt>
                  <dd>
                    {item.risk} · {item.fluctuation}
                  </dd>
                </div>
                <div>
                  <dt>Getting your money out</dt>
                  <dd>{item.liquidity}</dd>
                </div>
              </dl>
              <p className="note">
                <Info size={16} />
                {item.caution}
              </p>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
