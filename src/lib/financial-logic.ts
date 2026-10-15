/**
 * Financial Assumptions & Logic for Indian Beginner Demo
 * Goal: ₹1,000,000 | Monthly: ₹8,000
 */

export const SCENARIOS = {
  CONSERVATIVE: { annualRate: 0.07, label: "Conservative (Debt-heavy)" },
  BASE: { annualRate: 0.10, label: "Base (Balanced)" },
  OPTIMISTIC: { annualRate: 0.13, label: "Optimistic (Equity-heavy)" },
};

export const EMERGENCY_FUND_MULTIPLIER = 6; // months of expenses
export const ESTIMATED_MONTHLY_EXPENSES = 25000;

/**
 * End-of-month compounding formula
 * FV = P * ((1 + r)^n - 1) / r
 * @param monthlyP - Monthly investment
 * @param annualRate - Yearly interest rate (e.g. 0.10)
 * @param months - Investment duration
 */
export const calculateFV = (monthlyP: number, annualRate: number, months: number): number => {
  if (annualRate === 0) return monthlyP * months;
  const r = annualRate / 12;
  return monthlyP * (Math.pow(1 + r, months) - 1) / r;
};

/**
 * Solve for n (months) to reach goal
 * n = log(1 + (FV * r) / P) / log(1 + r)
 */
export const calculateMonthsToGoal = (goal: number, monthlyP: number, annualRate: number): number => {
  const r = annualRate / 12;
  return Math.log(1 + (goal * r) / monthlyP) / Math.log(1 + r);
};

/**
 * Market Shock Calculation (Downturn/Recovery)
 * Shock: -20% immediate drop
 * Recovery: Higher growth rate for subsequent period
 */
export const applyMarketShock = (currentValue: number, shockDrop = 0.20): number => {
  return currentValue * (1 - shockDrop);
};

/**
 * Concrete Test Values (Base Scenario: 10% returns)
 * Goal: 1,000,000
 * Monthly: 8,000
 * Expected Months: ~86.5 (7.2 years)
 */
export const TEST_VALUES = {
  monthly: 8000,
  goal: 1000000,
  baseRate: 0.10,
  expectedMonths: 86.48,
};
