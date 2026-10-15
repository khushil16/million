/** Illustrations only. Effective annual rate is converted to monthly rate.
 * Each month: opening balance earns growth, then contribution arrives at month end.
 * Emergency cash is separate and never counted toward the invested goal.
 * Taxes, fees and inflation are excluded. */
export const DEFAULT_GOAL = 1_000_000;
export const DEFAULT_MONTHLY = 8_000;
export const SCENARIOS = [
  { name: "Conservative", rate: 0.04 },
  { name: "Illustrative", rate: 0.08 },
  { name: "Optimistic", rate: 0.12 },
];
export function project(monthly: number, annualRate: number, months: number, opening = 0) {
  if (
    ![monthly, annualRate, months, opening].every(Number.isFinite) ||
    monthly < 0 ||
    opening < 0 ||
    annualRate <= -1 ||
    months < 0
  )
    throw new Error("Use valid non-negative amounts and a rate above −100%.");
  const n = Math.floor(months),
    r = Math.pow(1 + annualRate, 1 / 12) - 1;
  const balance =
    Math.abs(r) < 1e-10
      ? opening + monthly * n
      : opening * Math.pow(1 + r, n) + (monthly * (Math.pow(1 + r, n) - 1)) / r;
  const contributed = monthly * n;
  return { balance, contributed, growth: balance - opening - contributed };
}
export function monthsToGoal(
  monthly: number,
  rate: number,
  goal = DEFAULT_GOAL,
  opening = 0,
): number | null {
  if (opening >= goal) return 0;
  for (let month = 1; month <= 600; month++)
    if (project(monthly, rate, month, opening).balance >= goal) return month;
  return null;
}
export function downturn(balance: number, decline: number) {
  if (
    !Number.isFinite(balance) ||
    balance < 0 ||
    !Number.isFinite(decline) ||
    decline < 0 ||
    decline > 1
  )
    throw new Error("Invalid downturn.");
  return {
    lost: balance * decline,
    remaining: balance * (1 - decline),
    recoveryGain: decline === 1 ? null : decline / (1 - decline),
  };
}
export function setAllocation(amounts: number[], index: number, value: number, budget: number) {
  const next = [...amounts];
  const other = amounts.reduce((sum, n, i) => sum + (i === index ? 0 : n), 0);
  next[index] = Math.max(0, Math.min(Math.round(value), Math.max(0, budget - other)));
  return next;
}
export const rupees = (amount: number) => "₹" + Math.round(amount).toLocaleString("en-IN");
export function duration(months: number | null) {
  if (months === null) return "Beyond 50 years";
  const y = Math.floor(months / 12),
    m = months % 12;
  return `${y ? `${y} yr` : ""}${y && m ? " " : ""}${m ? `${m} mo` : ""}` || "Goal reached";
}

/* ------------------------------------------------------------------------------------------
 * Risk, crash and check-in illustrations.
 * Category order everywhere: [Emergency cash, Fixed deposits, Index funds, Gold].
 * All figures are simplified, hypothetical assumptions for education, not historical data.
 * ---------------------------------------------------------------------------------------- */

/** Illustrative fall of each category in a bad market year (fraction of its value). */
export const BAD_YEAR_FALL = [0, 0, 0.35, 0.2] as const;
/** Relative riskiness used for the 0–100 risk meter. */
const RISK_WEIGHT = [1, 1.5, 4.5, 3.5] as const;
const MARKET_LINKED = [false, false, true, true] as const;

const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);

export type RiskLevel = "None" | "Low" | "Moderate" | "High";
export function riskProfile(amounts: number[]) {
  const total = sum(amounts);
  const invested = total - (amounts[0] ?? 0);
  if (total <= 0)
    return {
      score: 0,
      level: "None" as RiskLevel,
      marketShare: 0,
      investedMarketShare: 0,
      badYearFall: 0,
    };
  const weighted = amounts.reduce((s, a, i) => s + a * (RISK_WEIGHT[i] ?? 1), 0) / total;
  const score = Math.round(((weighted - 1) / 3.5) * 100);
  const market = amounts.reduce((s, a, i) => s + (MARKET_LINKED[i] ? a : 0), 0);
  const badInvested =
    invested > 0
      ? amounts.reduce((s, a, i) => s + (i === 0 ? 0 : a * (BAD_YEAR_FALL[i] ?? 0)), 0) / invested
      : 0;
  return {
    score,
    level: (score < 25 ? "Low" : score < 55 ? "Moderate" : "High") as RiskLevel,
    /** share of the whole monthly mix that is market-linked */
    marketShare: market / total,
    /** share of the invested (non-cash) money that is market-linked */
    investedMarketShare: invested > 0 ? market / invested : 0,
    /** illustrative fall of the invested balance in a bad year */
    badYearFall: badInvested,
  };
}

/**
 * Same convention as `project`, with a one-off crash after `shockMonth` contributions:
 * the balance at that point falls by `shock` (fraction), then contributions and growth continue.
 */
export function projectWithShock(
  monthly: number,
  annualRate: number,
  months: number,
  shockMonth: number,
  shock: number,
  opening = 0,
) {
  if (!Number.isFinite(shock) || shock < 0 || shock > 1) throw new Error("Invalid shock.");
  const n = Math.floor(months);
  if (n <= shockMonth || shock === 0) return project(monthly, annualRate, n, opening);
  const atShock = project(monthly, annualRate, shockMonth, opening).balance * (1 - shock);
  const after = project(monthly, annualRate, n - shockMonth, atShock);
  const contributed = monthly * n;
  return { balance: after.balance, contributed, growth: after.balance - opening - contributed };
}

export function monthsToGoalWithShock(
  monthly: number,
  rate: number,
  shockMonth: number,
  shock: number,
  goal = DEFAULT_GOAL,
): number | null {
  for (let month = 1; month <= 600; month++)
    if (projectWithShock(monthly, rate, month, shockMonth, shock).balance >= goal) return month;
  return null;
}

export type StormResponse = {
  id: "stay" | "pause" | "sell";
  value: number;
  months: number | null;
};
/**
 * Three ways to respond after a fall, compared over the next 3 years at the user's hypothetical rate.
 * "sell" moves everything (and future savings) to a bank account at an assumed 3%.
 * A constant rate is used for all three, so this shows the effect of the choice, not a market forecast.
 */
export const SAFE_RATE = 0.03;
export function stormResponses(
  remaining: number,
  monthly: number,
  rate: number,
  goal = DEFAULT_GOAL,
): StormResponse[] {
  const pausedYear = project(0, rate, 12, remaining).balance;
  const pauseMonths = monthsToGoal(monthly, rate, goal, pausedYear);
  return [
    {
      id: "stay",
      value: project(monthly, rate, 36, remaining).balance,
      months: monthsToGoal(monthly, rate, goal, remaining),
    },
    {
      id: "pause",
      value: project(monthly, rate, 24, pausedYear).balance,
      months: pauseMonths === null ? null : 12 + pauseMonths,
    },
    {
      id: "sell",
      value: project(monthly, SAFE_RATE, 36, remaining).balance,
      months: monthsToGoal(monthly, SAFE_RATE, goal, remaining),
    },
  ];
}

/** Simulated, bumpy yearly returns for check-ins. Deterministic and clearly not historical. */
export const SIMULATED_YEARS = {
  cash: 0.03,
  deposits: 0.065,
  index: [
    0.11, -0.16, 0.19, 0.08, 0.13, -0.24, 0.21, 0.1, 0.06, 0.15, -0.09, 0.12, 0.14, 0.04, 0.17,
    -0.12, 0.13, 0.09, 0.11, 0.07,
  ],
  gold: [
    0.06, 0.14, -0.04, 0.09, 0.03, 0.12, -0.07, 0.08, 0.1, -0.02, 0.05, 0.11, -0.06, 0.07, 0.04,
    0.13, -0.03, 0.06, 0.08, 0.02,
  ],
};

export type Holding = { contributed: number; value: number };
/** Month-by-month balances of each category with end-of-month contributions. */
export function simulateHoldings(amounts: number[], months: number): Holding[] {
  const n = Math.max(0, Math.floor(months));
  return amounts.map((monthly, i) => {
    let value = 0;
    for (let m = 0; m < n; m++) {
      const year = Math.floor(m / 12);
      const annual =
        i === 0
          ? SIMULATED_YEARS.cash
          : i === 1
            ? SIMULATED_YEARS.deposits
            : ((i === 2 ? SIMULATED_YEARS.index : SIMULATED_YEARS.gold)[year % 20] ?? 0);
      value = value * Math.pow(1 + annual, 1 / 12) + monthly;
    }
    return { contributed: monthly * n, value };
  });
}

export type CheckIn = { tone: "calm" | "act" | "note"; title: string; text: string };
/** One or two plain-language suggestions for a check-in, most important first. */
export function checkInAdvice(
  amounts: number[],
  holdings: Holding[],
  emergencyTarget: number,
): CheckIn[] {
  const out: CheckIn[] = [];
  const cash = holdings[0]?.value ?? 0;
  const investedPlan = sum(amounts.slice(1));
  const investedNow = sum(holdings.slice(1).map((h) => h.value));
  if (emergencyTarget > 0 && cash >= emergencyTarget && (amounts[0] ?? 0) > 0)
    out.push({
      tone: "act",
      title: "Your safety net is full",
      text: `You hold about ${rupees(cash)} in emergency cash, above your ${rupees(emergencyTarget)} target. You could move the ${rupees(amounts[0] ?? 0)}/month you were saving there into your plan.`,
    });
  const idx = holdings[2];
  if (idx && idx.contributed > 0 && idx.value < idx.contributed)
    out.push({
      tone: "note",
      title: "Index funds are below what you put in",
      text: "That is normal after a falling year and is exactly what this plan expects. If your needs haven't changed, keeping the monthly amount going buys more units at lower prices.",
    });
  if (investedPlan > 0 && investedNow > 0 && idx) {
    const planShare = (amounts[2] ?? 0) / investedPlan;
    const nowShare = idx.value / investedNow;
    if (Math.abs(nowShare - planShare) > 0.07)
      out.push({
        tone: "act",
        title: nowShare > planShare ? "Your mix has drifted riskier" : "Your mix has drifted safer",
        text: `Index funds are now ${Math.round(nowShare * 100)}% of your invested money versus ${Math.round(planShare * 100)}% planned. Rebalance gently by pointing new contributions to the parts that are under target, rather than selling.`,
      });
  }
  if (out.length === 0)
    out.push({
      tone: "calm",
      title: "On track. Nothing to change",
      text: "Your mix is close to plan. The most useful thing to do is keep contributing and check in again in six months.",
    });
  return out.slice(0, 2);
}

export type ComfortAnswers = {
  horizon: number;
  emergency: string;
  responsibility: string;
  tolerance: string;
};
/** Picks one of the three sample mixes from the comfort answers, with the reasons in plain words. */
export function suggestMix(a: ComfortAnswers): { preset: number; reasons: string[] } {
  const reasons: string[] = [];
  let preset = 1;
  if (a.horizon < 3) {
    preset = 0;
    reasons.push(
      `You may need this money within ${a.horizon} year${a.horizon === 1 ? "" : "s"}, which is too soon to wait out a market fall.`,
    );
  } else if (a.tolerance === "I’d sell immediately") {
    preset = 0;
    reasons.push(
      "You said you'd sell after a 25% fall. A calmer mix makes it easier to stay invested.",
    );
  } else if (
    a.horizon >= 7 &&
    a.tolerance === "I could wait and review" &&
    a.emergency !== "Starting from zero" &&
    a.responsibility === "Just my own expenses"
  ) {
    preset = 2;
    reasons.push(
      `A ${a.horizon}-year horizon and a calm reaction to losses give room for more growth assets.`,
    );
  } else {
    reasons.push(
      "A middle path: some growth, with enough steady money that a fall won't derail you.",
    );
  }
  if (a.emergency === "Starting from zero")
    reasons.push("You're starting with no emergency savings, so the cash part should come first.");
  if (a.responsibility !== "Just my own expenses")
    reasons.push("Others depend on your income, so keep more of it safe and easy to reach.");
  return { preset, reasons };
}
