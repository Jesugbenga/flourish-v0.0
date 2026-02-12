# Flourish — Hackathon Proposal

Tagline: Flourish — Save smarter, plan meals, and build lasting money habits.

## Problem statement

Busy families — especially mums juggling childcare, work, and household logistics — need simple, emotionally‑supportive tools that help them save money and build financial confidence. Existing money apps are often too complex, punitive, or time‑consuming. There is a gap for an approachable product that makes saving feel achievable and rewarding.

# Flourish — Hackathon Proposal

Tagline: Flourish — Save smarter, plan meals, and build lasting money habits.

## Problem statement

Busy families — especially mums juggling childcare, work, and household logistics — need simple, emotionally‑supportive tools that help them save money and build financial confidence. Existing money apps are often too complex, punitive, or time‑consuming. There is a gap for an approachable product that makes saving feel achievable and rewarding.

## Solution overview

Flourish addresses this need by combining bite‑sized habit mechanics with AI assistance and a gentle, encouraging UX. Key elements:

- **Smart Swaps:** AI suggests lower‑cost alternatives with estimated savings.
- **AI Meal Planner:** Budgeted weekly meal plans and shopping lists tailored to user preferences.
- **Quick Wins & Challenges:** Users log small savings as “wins” and join 7‑day or monthly challenges to build streaks.
- **AI Coach:** Context‑aware chat for money, meals, and goals (server‑side AI to protect keys).

The app focuses on celebrating progress rather than policing every expense — driving retention through positive reinforcement and achievable goals.

Key value: small daily changes compound into meaningful savings and confidence over time.

### Mathematical intuition (used in the UI)

Total savings over n wins:

$$
S_{total} = \\sum_{i=1}^{n} \\text{Win}_i
$$

Yearly impact for a recurring swap:

$$
\\text{YearlySaving} = (\\text{OldCost} - \\text{NewCost}) \\times 52
$$

---

## Monetization strategy

Flourish uses a freemium model.

- **Free tier:** core logging, basic meal plans, sample swaps, and demo challenges to encourage adoption.

- **Premium tier:** **£4.99 / month** or **£49.99 / year**

**Premium unlocks:**

- Unlimited Smart Swaps
- AI Meal Planner
- Goal‑Based Calculator
- Flo AI Chatbot
- Full Investing Lessons
- Advanced Challenges
- Community posting
- Advanced savings analytics
- Add‑ons: one‑time themed challenge packs and printable/consultation bundles

### Rationale

- Affordable for families
- Competitive within the productivity/finance category
- Positioned as a small monthly investment that yields measurable savings

If a user saves just £5 per week, yearly savings are:

$$
£5×52=£260  /  year
$$

The subscription pays for itself many times over.

### Future monetization expansions

- Sponsored grocery partnerships
- Affiliate investing platforms (educational, compliant)
- Seasonal challenge packs
- Family goal visualizations
- Corporate wellness partnerships

### Conversion drivers

- Short premium trial
- Goal‑based CTAs showing projected savings unlocked by premium features

### Metrics to measure

- Trial → paid conversion
- Churn
- ARPU
- Average reported savings per user
- Retention driven by challenges

---

## Roadmap (if selected / post‑hackathon)

0–3 months — polish and reliability

- Harden production builds (EAS + app.config.js), ensure env secrets and CI are set.
- Fix cross‑device persistence so challenge completions sync server‑side.
- UX polish, accessibility, and analytics instrumentation.

3–6 months — personalization & retention

- Per‑user personalization for swaps and meal plans using basic spending signals.
- Push encouragements and scheduled nudges; run A/B tests on challenge incentives.
- Build premium trial funnels and optimize conversion flows.

6–12 months — community & growth

- Add community feed to share wins and run social challenges.
- Family multi‑profile plans and shared goals dashboards.
- Smart grocery price tracking and deal alerts (regional).

12+ months — scale & product extensions

- Web dashboard and improved analytics for long‑term engagement.
- Deeper investing educational tracks and optional partner referrals.

---

## Technical notes

- Frontend: React Native (Expo), TypeScript, `expo-router`.
- Backend: Serverless functions + Firestore (or Supabase in later roadmap), secure server-side AI calls to Google Gemini.
- Payments: RevenueCat for subscription billing and webhooks.
- Build & secrets: EAS Build + secrets injected into `app.config.js` → `expo.extra` (no secrets committed to repo).

---

## Ask / Resources needed

- Funding for Gemini usage to power premium AI features during growth phase.
- Mentorship for growth experiments (A/B testing, onboarding funnels).
- Early user feedback and testers for emotional UX tuning.

Small wins compound. Confidence compounds.
And when families flourish, communities do too.
