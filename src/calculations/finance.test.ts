import { describe, expect, it } from "vitest";
import {
  checkInAdvice,
  monthsToGoalWithShock,
  projectWithShock,
  riskProfile,
  simulateHoldings,
  stormResponses,
  suggestMix,
  DEFAULT_GOAL,
  DEFAULT_MONTHLY,
  downturn,
  monthsToGoal,
  project,
  setAllocation,
} from "./finance";
describe("Honest million assumptions", () => {
  it("starts with ₹8,000 monthly and a ₹10,00,000 goal", () => {
    expect(DEFAULT_MONTHLY).toBe(8000);
    expect(DEFAULT_GOAL).toBe(1000000);
  });
  it("adds end-of-month contributions with no first-month growth", () => {
    expect(project(8000, 0.08, 1).balance).toBeCloseTo(8000, 6);
  });
  it("converts effective annual growth to monthly compounding", () => {
    expect(project(0, 0.08, 12, 100000).balance).toBeCloseTo(108000, 5);
  });
  it("separates contributions and growth", () => {
    const p = project(8000, 0.08, 12);
    expect(p.contributed).toBe(96000);
    expect(p.balance).toBeCloseTo(p.contributed + p.growth, 6);
  });
  it("reaches the goal after 125 contributions at zero growth", () => {
    expect(monthsToGoal(8000, 0)).toBe(125);
  });
  it("applies a 25% storm and distinguishes the recovery gain", () => {
    const d = downturn(400000, 0.25);
    expect(d.lost).toBe(100000);
    expect(d.remaining).toBe(300000);
    expect(d.recoveryGain).toBeCloseTo(1 / 3);
  });
  it("never allocates more than the monthly budget", () => {
    expect(setAllocation([2000, 2000, 3200, 800], 2, 6000, 8000)).toEqual([2000, 2000, 3200, 800]);
  });
  it("excludes emergency cash from the invested projection", () => {
    const amounts = [2000, 2000, 3200, 800];
    const invested = amounts.slice(1).reduce((a, b) => a + b, 0);
    expect(project(invested, 0, 12).balance).toBe(72000);
  });
  it("handles unreachable goals without inventing a date", () => {
    expect(monthsToGoal(0, 0)).toBeNull();
  });
  it("rejects invalid numeric input", () => {
    expect(() => project(NaN, 0.08, 12)).toThrow();
    expect(() => project(-1, 0.08, 12)).toThrow();
  });
});

describe("Risk, crash and check-in illustrations", () => {
  it("scores an all-cash mix as low risk with no market exposure", () => {
    const r = riskProfile([8000, 0, 0, 0]);
    expect(r.level).toBe("Low");
    expect(r.marketShare).toBe(0);
    expect(r.badYearFall).toBe(0);
  });
  it("rates an equity-heavy mix higher than a balanced one", () => {
    expect(riskProfile([1200, 1200, 4800, 800]).score).toBeGreaterThan(
      riskProfile([2000, 2000, 3200, 800]).score,
    );
  });
  it("computes the bad-year fall on invested money only", () => {
    // invested 6000: 2000 FD (0%), 3200 index (35%), 800 gold (20%)
    expect(riskProfile([2000, 2000, 3200, 800]).badYearFall).toBeCloseTo(
      (3200 * 0.35 + 800 * 0.2) / 6000,
      10,
    );
  });
  it("leaves the projection unchanged before the crash month", () => {
    expect(projectWithShock(6000, 0.08, 24, 36, 0.3).balance).toBeCloseTo(
      project(6000, 0.08, 24).balance,
      6,
    );
  });
  it("applies the crash once, then keeps contributing", () => {
    const before = project(6000, 0.08, 36).balance * 0.7;
    expect(projectWithShock(6000, 0.08, 48, 36, 0.3).balance).toBeCloseTo(
      project(6000, 0.08, 12, before).balance,
      6,
    );
  });
  it("delays the goal when a crash is included", () => {
    const calm = monthsToGoal(6000, 0.08)!;
    expect(monthsToGoalWithShock(6000, 0.08, 60, 0.25)!).toBeGreaterThan(calm);
  });
  it("shows selling as the slowest path back at the same assumptions", () => {
    const [stay, pause, sell] = stormResponses(300000, 6000, 0.08);
    expect(stay!.value).toBeGreaterThan(pause!.value);
    expect(stay!.value).toBeGreaterThan(sell!.value);
    expect(stay!.months!).toBeLessThan(sell!.months!);
  });
  it("simulates holdings that contribute exactly the monthly amounts", () => {
    const h = simulateHoldings([2000, 2000, 3200, 800], 12);
    expect(h.map((x) => x.contributed)).toEqual([24000, 24000, 38400, 9600]);
    expect(h[2]!.value).toBeGreaterThan(0);
  });
  it("flags a full safety net at check-in", () => {
    const h = simulateHoldings([4000, 2000, 1000, 1000], 24);
    expect(checkInAdvice([4000, 2000, 1000, 1000], h, 36000)[0]!.title).toMatch(/safety net/i);
  });
  it("suggests the safest mix for a short horizon", () => {
    expect(
      suggestMix({
        horizon: 2,
        emergency: "6+ months of expenses",
        responsibility: "Just my own expenses",
        tolerance: "I could wait and review",
      }).preset,
    ).toBe(0);
  });
  it("suggests the long-horizon mix only when every answer allows it", () => {
    const base = {
      horizon: 10,
      emergency: "6+ months of expenses",
      responsibility: "Just my own expenses",
      tolerance: "I could wait and review",
    };
    expect(suggestMix(base).preset).toBe(2);
    expect(suggestMix({ ...base, emergency: "Starting from zero" }).preset).toBe(1);
  });
});
