import type { riskProfile, suggestMix } from "@/calculations/finance";

export type JourneyState = {
  monthly: number;
  amounts: number[];
  preset: number;
  presetInfo: { name: string; shares: readonly number[] | number[]; rationale: string };
  horizon: number;
  emergency: string;
  responsibility: string;
  tolerance: string;
  /** hypothetical blended annual growth, in percent */
  rate: number;
  expense: number;
  /** hypothetical market fall, in percent */
  decline: number;
  storm: boolean;
  allocated: number;
  /** monthly amount that goes toward the goal (everything except emergency cash) */
  invested: number;
  risk: ReturnType<typeof riskProfile>;
  suggestion: ReturnType<typeof suggestMix>;
  /** illustrative invested balance after five years */
  yearFive: number;
  /** year-5 fall applied to the market-linked part only */
  stormHit: { lost: number; remaining: number; recoveryGain: number | null };
  goalMonths: number | null;
  unsuitable: boolean;
};

export type JourneyActions = {
  setSelected: (n: number) => void;
  setHorizon: (n: number) => void;
  setEmergency: (v: string) => void;
  setResponsibility: (v: string) => void;
  setTolerance: (v: string) => void;
  setRate: (n: number) => void;
  setExpense: (n: number) => void;
  setDecline: (n: number) => void;
  setStorm: (b: boolean) => void;
  setAmounts: (a: number[]) => void;
  changeMonthly: (n: number) => void;
  choosePlan: (i: number) => void;
};
