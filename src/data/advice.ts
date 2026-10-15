/**
 * Educational guidance shown alongside the plan. General, not personalised advice:
 * it describes common starting approaches for a first-time investor in India.
 * Order matches `categories`: Emergency cash, Fixed deposits, Index funds, Gold.
 */
export const allocationGuide = [
  {
    role: "Your safety net",
    where: "A savings account (or an auto-sweep deposit) at a bank you already use.",
    when: "Fill this first, every month, until it covers about six months of essentials. Then redirect the amount.",
    risk: "No market risk. Inflation slowly reduces what it buys.",
  },
  {
    role: "Money you need in 1–3 years",
    where:
      "Bank fixed deposits or post-office time deposits. Pick a term that ends when you need the money.",
    when: "For known near-term costs (fees, a laptop). Several smaller deposits ending at different times keep it flexible.",
    risk: "Value doesn't swing, but breaking a deposit early can cost interest.",
  },
  {
    role: "Long-term growth engine",
    where:
      "A broad-market index fund (for example a Nifty 50 index fund), direct plan, from a SEBI-registered fund house. Check the expense ratio.",
    when: "A fixed monthly SIP a few days after your money arrives. Don't wait for the 'right moment'; only use money you won't need for 5+ years.",
    risk: "Can fall 30–40% in a bad year. Needs time to recover.",
  },
  {
    role: "A small diversifier",
    where: "Gold ETFs or gold mutual funds, rather than jewellery with making charges.",
    when: "Keep it a small slice (around 5–10%). It often moves differently from shares, but pays no interest.",
    risk: "Prices move both ways; gold can stay flat for years.",
  },
] as const;

/** A gentle order of operations for someone starting from zero. */
export const startingOrder = [
  {
    when: "Month 1",
    what: "Open or choose a savings account for emergencies. Complete KYC (PAN + Aadhaar) so you can invest later.",
  },
  {
    when: "Months 1–6",
    what: "Put the emergency-cash part away every month. Start a small index-fund SIP alongside if your safety net is underway.",
  },
  {
    when: "Every month",
    what: "Invest on the same date by automatic SIP. Consistency matters more than timing.",
  },
  {
    when: "Every 6–12 months",
    what: "Check in once: is the mix close to plan, has life changed? Rebalance with new money, not by selling.",
  },
] as const;

/** Ways to manage a loss, used on the storm stage. */
export const lossToolkit = [
  {
    title: "A safety net first",
    text: "Emergency cash means a fall never forces you to sell to pay bills.",
  },
  {
    title: "Only part of your money can fall",
    text: "Deposits and cash don't drop in a crash. Your mix decides how much is exposed.",
  },
  {
    title: "Keep the SIP going",
    text: "Continuing to invest after a fall buys more units at lower prices.",
  },
  {
    title: "Review needs, not prices",
    text: "Change the plan if your life changed, not because the market did.",
  },
] as const;

export const responseCopy = {
  stay: {
    label: "Stay the course",
    detail: "Keep the same monthly amount going.",
    lesson: "Usually the steadiest route back. You keep buying while prices are low.",
  },
  pause: {
    label: "Pause for a year",
    detail: "Stop contributing for 12 months, then restart.",
    lesson: "Understandable if money is tight, but the missed months add up later.",
  },
  sell: {
    label: "Sell and move to savings",
    detail: "Sell everything and save in a bank account at about 3%.",
    lesson: "Turns a temporary fall into a permanent loss, and future savings grow slowly.",
  },
} as const;
