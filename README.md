# MILLIONS

Build a visually extraordinary, production-quality, 3D interactive financial planning web application called MILLION / ONE for the hackathon problem statement “The Honest Million: Too many options. One big goal.”

CORE PRODUCT IDEA

The user is a 19-year-old college student in India with ₹8,000 per month in available income, no investing experience, and a goal of becoming a millionaire. The problem is decision paralysis caused by too many investment choices, conflicting advice, and uncertainty about market losses.

Build a product that transforms this overwhelming financial journey into an understandable, interactive, personalized experience. The interface should help users understand investment options, create a realistic monthly plan, explore how long their goal could take, and experience market downturns without panic.

The website must prioritize outstanding UI/UX, visual storytelling, 3D graphics, thoughtful micro-interactions, and excellent frontend execution. This is a UI-focused hackathon: visual impact and usability are the highest priorities.

1. ART DIRECTION — MAKE IT LOOK UNLIKE A TEMPLATE

Create a cinematic, premium, immersive financial universe.

Visual identity:

Obsidian-black and midnight-navy background.

Warm champagne gold, liquid amber, and subtle ivory typography.

Deep atmospheric gradients, realistic lighting, volumetric glow, and elegant reflections.

Premium editorial typography with large serif headlines paired with clean modern sans-serif interface text.

Fine star particles, orbital paths, floating gold dust, and restrained glassmorphism.

High-quality 3D assets with realistic depth, soft shadows, ambient occlusion, and layered compositions.

Use asymmetrical layouts and deliberate negative space rather than a conventional grid of identical dashboard cards.

Create a recognizable visual signature that judges can remember.

The aesthetic should feel like a combination of a luxury wealth-management brand, a cinematic space exploration experience, and a next-generation interactive product.

Avoid generic fintech templates, excessive rounded cards, rainbow gradients, excessive neon, cartoonish money illustrations, emoji-heavy interfaces, and walls of financial charts.

2. THE HERO — THE MILLION-RUPEE UNIVERSE

Make the opening screen unforgettable.

Use a full-screen, dark cinematic scene featuring a slowly rotating, physically illuminated golden celestial sphere representing the user's ₹10,00,000 milestone.

Surround the sphere with delicate orbital rings, floating financial particles, and subtle constellations representing possible investment paths. Use perspective, depth, lighting, and layered elements to create the illusion that the goal exists inside a navigable 3D universe.

Display the headline:

“ONE GOAL.
A MILLION POSSIBILITIES.”

Supporting copy:
“Your first investment plan starts with understanding, not guessing.”

Show the user's starting context:

Monthly amount available: ₹8,000

Goal: ₹10,00,000

Experience: First-time investor

Primary CTA: “Begin my journey”
Secondary CTA: “Explore the possibilities”

The main CTA should smoothly transition the user into an immersive guided experience. Add subtle cursor-responsive parallax and gentle movement, but never sacrifice readability or performance.

Use Three.js or React Three Fiber for the 3D environment, with realistic materials, lighting, depth, and camera movement. Provide a graceful CSS-based fallback for devices that cannot handle intensive 3D rendering.

3. THE GUIDED JOURNEY — REPLACE DASHBOARD OVERLOAD

Do not expose every feature at once.

Build a progressive, guided journey with a persistent, elegant progress indicator. Reveal one meaningful decision at a time. The user should always understand where they are, why the current decision matters, and what comes next.

Create these stages:

STAGE 01 — UNDERSTAND
Introduce the user to the essentials: savings accounts, fixed deposits, bonds, mutual funds, index funds, gold, and other relevant instruments.

Present them as distinct, interactive 3D objects or stations within an investment universe. Each station opens a concise explanation covering:

What it is.

How returns or interest work.

What risks exist.

Whether its value can fluctuate.

Liquidity and lock-in considerations.

What a beginner should understand before choosing it.

Make comparisons visual and approachable. Use plain language and explain technical terms when they first appear.

STAGE 02 — DISCOVER YOUR COMFORT ZONE
Ask a small number of clear questions about the user's time horizon, emergency savings, financial responsibilities, and ability to tolerate losses.

Use elegant interactive sliders, selectable scenarios, and visual responses instead of long forms.

Do not assume that the highest-return option is the best option. Explain trade-offs and avoid prescribing an unsuitable investment mix.

STAGE 03 — BUILD YOUR PLAN
Create an interactive monthly allocation experience.

Let users adjust how much of their ₹8,000 monthly amount goes into different categories. Show the allocation dynamically using an elegant 3D ring, flowing particles, or a layered orbital visualization.

Display:

Monthly contribution.

Amount allocated to each category.

Remaining unallocated amount.

Emergency savings considerations.

Risk profile and diversification.

Estimated time to the goal.

Conservative, illustrative, and optimistic scenarios.

Allow users to compare a few sensible plans rather than generating dozens of choices.

STAGE 04 — TRAVEL THROUGH TIME
This is the signature feature of the application.

Create a beautiful, interactive 3D financial timeline extending from the present toward the ₹10,00,000 milestone.

The user moves through years by dragging a time slider or scrubbing along a glowing golden orbital path. As the timeline changes, show the projected portfolio value, cumulative contributions, illustrative growth, and distance remaining to the goal.

Provide milestone markers, subtle particle trails, and transitions that communicate progress without overwhelming the user.

Allow comparison of different monthly contributions, time horizons, and hypothetical return assumptions.

Clearly distinguish money contributed from hypothetical investment growth. Never portray projections as guaranteed outcomes.

STAGE 05 — THE MARKET STORM
Create a dramatic, interactive market-downturn simulation.

The environment shifts from calm golden light to a darker atmosphere. Orbital paths become turbulent, the portfolio visualization drops, and the projected goal date changes.

Show the user:

Their portfolio before the downturn.

The hypothetical decline in percentage and rupees.

The remaining portfolio value.

How recovery could work under different illustrative scenarios.

Whether the long-term plan remains feasible.

Why panic selling can affect long-term outcomes.

Provide meaningful choices such as reviewing the plan, learning about volatility, or examining a hypothetical recovery scenario.

The goal is financial education and emotional preparedness, not fear or sensationalism.

STAGE 06 — YOUR PERSONAL PLAN
Generate a clear, beautiful summary of the user's selected plan.

Include:

Monthly contribution.

Selected allocation and rationale.

Emergency fund considerations.

Key risks and liquidity limitations.

Illustrative goal timeline.

Assumptions used.

Next steps and a way to revisit the plan.

Make the result feel like a personal financial roadmap rather than a spreadsheet.

4. SIGNATURE 3D INTERACTIONS

Implement these interactions properly:

A rotating, illuminated golden milestone sphere that responds subtly to cursor movement.

Interactive investment stations that reveal information when selected.

A live allocation visualization that updates as the user adjusts amounts.

A draggable timeline that updates all relevant financial projections.

A market-storm simulation with animated environmental changes and updated hypothetical portfolio values.

Smooth transitions between journey stages, with coherent camera movement and lighting.

A subtle progress trail that connects completed stages.

An elegant achievement or milestone moment when users finish building their plan, without turning the app into a childish game.

Use GSAP or Motion for interface transitions and micro-interactions. Avoid competing animation systems for the same elements.

3D must communicate meaning. Do not add decorative 3D objects that make important actions harder to find.

5. FINANCIAL SIMULATION AND HONESTY

Use realistic, deterministic sample data and transparent calculation assumptions.

For monthly contributions, calculate projections using a clearly documented contribution schedule and an explicitly stated hypothetical return assumption. Keep the convention consistent across the application.

Account for:

Monthly contributions.

Compounding.

Contribution timing.

Investment growth assumptions.

Illustrative market declines.

Different time horizons.

A suitable default goal is ₹10,00,000. Make the monthly contribution editable.

Show multiple scenarios without suggesting that any projected return is guaranteed. Do not fabricate historical returns, live market data, financial credentials, or personalized recommendations.

Clearly label simulated data. Include suitable educational disclaimers and avoid collecting unnecessary personal or banking information.

6. UI DETAILS THAT MAKE IT FEEL PREMIUM

Design every state, not just the initial screen.

Include:

Sophisticated navigation with a compact journey indicator.

Custom-designed buttons with subtle hover and press states.

Animated number transitions.

Beautiful sliders and accessible controls.

Skeleton or loading states where appropriate.

Empty, validation, error, and success states.

Informative tooltips.

Keyboard accessibility and visible focus states.

Responsive desktop, tablet, and mobile layouts.

Reduced-motion support.

Smooth scrolling and carefully paced transitions.

Use high contrast for financial figures and ensure that important text remains readable over 3D scenes.

On mobile, simplify the 3D environment and prioritize the core workflow.

7. TECH STACK AND CODE QUALITY

Preferred stack:

React with Vite.

TypeScript.

Tailwind CSS.

Three.js with React Three Fiber and Drei for 3D.

GSAP or Motion for transitions.

Recharts or custom SVG for lightweight supporting charts.

Lucide icons.

Keep the frontend modular and maintainable.

Suggested architecture:

components/hero

components/investment-universe

components/financial-controls

components/allocation-visualization

components/timeline

components/market-simulation

components/plan-summary

hooks

calculations

data

pages

Separate financial calculation logic from UI components. Use validated numeric inputs, reusable components, predictable state management, and clearly named functions.

Do not put the entire application into one giant component. Do not leave dead buttons, placeholder navigation, broken interactions, or TODO-only features.

If an external service is unavailable, implement the complete demo experience with clearly labeled local sample data rather than blocking the core workflow.

8. PRESENTATION AND JUDGING IMPACT

Optimize the experience for a live hackathon demonstration.

The first 10 seconds should establish the product's visual identity. The next 30 seconds should show the guided experience and a meaningful interaction. Within the first minute, judges should see the allocation visualization, the projected goal timeline, and the market-downturn simulation.

Provide a coherent, fully navigable demo journey with realistic sample values. The interface should communicate the entire product even if no real financial API or production backend is connected.

FINAL REQUIREMENT

Build the actual interactive website, not just a static mockup.

Prioritize a remarkable first screen, coherent 3D art direction, intuitive progressive disclosure, meaningful interactions, reliable financial calculations, responsive performance, and polished execution.

The finished product should feel like an award-caliber digital experience for a serious financial problem: cinematic and immersive on the surface, honest and understandable underneath.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://wealth-quest-3d.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c5b11411-7478-551f-824b-9798a7ea9803).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
