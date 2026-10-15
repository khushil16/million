export const investments = [
  {
    name: "Savings account",
    meters: { risk: 1, swings: 1, access: 5, growth: 1 },
    short: "Savings",
    type: "Your safety net",
    risk: "Low",
    fluctuation: "Generally stable balance",
    liquidity: "Usually accessible on demand.",
    description: "Money held in a bank account. The bank pays interest on your balance.",
    returns: "Variable interest paid by the bank; rates can change.",
    caution:
      "Inflation can reduce what your cash can buy. Eligible deposits are insured up to ₹5 lakh per depositor per bank under DICGC rules.",
    symbol: "shield",
  },
  {
    name: "Fixed deposit",
    meters: { risk: 1, swings: 1, access: 2, growth: 2 },
    short: "Fixed deposits",
    type: "A steadier orbit",
    risk: "Low–moderate",
    fluctuation: "Usually fixed maturity value",
    liquidity: "A chosen term; early withdrawal may reduce interest or attract a penalty.",
    description: "A bank deposit held for a fixed period at an agreed interest rate.",
    returns: "Interest follows the agreed terms, not stock-market prices.",
    caution: "Check the bank, deposit protection limits, taxes and early withdrawal terms.",
    symbol: "layers",
  },
  {
    name: "Bonds",
    meters: { risk: 2, swings: 2, access: 2, growth: 2 },
    short: "Bonds",
    type: "Lending, not owning",
    risk: "Varies by issuer",
    fluctuation: "Prices can rise and fall",
    liquidity: "Some bonds are hard to sell before maturity.",
    description:
      "You lend to a government or company. The issuer promises payments and repayment at maturity.",
    returns: "Coupon payments are interest; selling before maturity can cause a gain or loss.",
    caution: "An issuer can fail to pay. Rising interest rates can reduce bond prices.",
    symbol: "orbit",
  },
  {
    name: "Mutual funds",
    meters: { risk: 3, swings: 3, access: 4, growth: 3 },
    short: "Mutual funds",
    type: "A shared journey",
    risk: "Depends on holdings",
    fluctuation: "Market value changes daily",
    liquidity:
      "Many allow redemption, but exit charges and settlement times apply; some have lock-ins.",
    description:
      "A pooled investment that buys a collection of assets, managed to a stated strategy.",
    returns: "The value of the underlying assets changes. Costs are deducted from the fund.",
    caution:
      "A fund is not a guaranteed-return product. Read its holdings, risk level and expense ratio (its annual cost).",
    symbol: "network",
  },
  {
    name: "Index funds",
    meters: { risk: 4, swings: 4, access: 4, growth: 4 },
    short: "Index funds",
    type: "Own a wider universe",
    risk: "Market-linked",
    fluctuation: "Can fall substantially",
    liquidity: "Generally redeemable; settlement times and exit charges may apply.",
    description: "A mutual fund that aims to track an index: a defined basket of securities.",
    returns: "Tracks the basket’s performance, less fees and tracking differences.",
    caution:
      "Diversification spreads exposure; it does not prevent market losses. Equity money needs a long horizon.",
    symbol: "spark",
  },
  {
    name: "Gold",
    meters: { risk: 3, swings: 4, access: 3, growth: 3 },
    short: "Gold",
    type: "A different kind of asset",
    risk: "Market-linked",
    fluctuation: "Prices move in both directions",
    liquidity:
      "Varies: physical gold has buying/selling costs; financial products have their own terms.",
    description: "Exposure to gold through physical metal or regulated investment products.",
    returns: "Any gain comes from price changes; gold itself pays no interest.",
    caution:
      "Check purity, storage, fees, taxes and the specific product’s liquidity. No guaranteed growth.",
    symbol: "gem",
  },
];
export const categories = ["Emergency cash", "Fixed deposits", "Index funds", "Gold"];
export const presets = [
  {
    name: "Safety first",
    shares: [0.4, 0.4, 0.15, 0.05],
    rationale:
      "More cash and deposits, less market exposure. Lower potential growth; inflation still matters.",
  },
  {
    name: "Balanced start",
    shares: [0.25, 0.25, 0.4, 0.1],
    rationale:
      "Balances a cash buffer, deposits and market-linked exposure. Losses remain possible.",
  },
  {
    name: "Long horizon",
    shares: [0.15, 0.15, 0.6, 0.1],
    rationale:
      "More equity exposure and greater possible declines. Only explore with a long horizon and a separate safety net.",
  },
];
export const stages = [
  "Understand",
  "Your comfort zone",
  "Build your plan",
  "Travel through time",
  "The market storm",
  "Manage over time",
  "Your personal plan",
];

/** Simplified 1–5 relative guide used for the visual comparison meters. Not a rating of any product. */
export const meterLabels = [
  { key: "risk", label: "Risk of loss" },
  { key: "swings", label: "Ups & downs" },
  { key: "access", label: "Easy to withdraw" },
  { key: "growth", label: "Growth potential" },
] as const;
