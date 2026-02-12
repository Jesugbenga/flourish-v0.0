# 🌸 Flourish — Project Story

## Demo

To make it easy for judges to explore the app without creating an account, use this demo sign-in:

- **Email:** demo@flourish.app
- **Password:** Demo1234!

Sign in with Email/Password on the welcome screen. The demo account contains example profile data, sample wins, and an active 7-day challenge so you can explore the core flows.

## 🌸 Inspiration

Flourish was inspired by a simple but powerful observation:

Busy mums are expected to manage everything — but rarely given tools designed specifically for them.

Most finance apps feel overwhelming, spreadsheet-heavy, and emotionally cold. We wanted to build something different — something calm, empowering, and confidence-building.

Instead of focusing on restriction, Flourish focuses on growth.

Instead of tracking every penny, it celebrates small wins.

Instead of complex investing dashboards, it offers approachable, guided learning.

We were inspired by modern, minimal apps like Uber — clean, intuitive, purposeful — combined with the warmth and encouragement you’d expect from a trusted coach.

Flourish isn’t about budgeting harder.
It’s about flourishing.

## 💡 What It Does

Flourish is an AI-powered financial confidence app for busy families. It helps mums:

🌱 Discover daily money-saving tips

🛒 Plan meals and grocery budgets with AI

🔄 Find smarter swaps to reduce spending

🏆 Track “Quick Wins” and total savings

📊 Monitor budgets

📈 Learn simple investing fundamentals

🤖 Ask an AI coach anything about money, meals, or savings

🎯 Set and calculate savings goals

🏅 Participate in monthly and 7-day challenges

We calculate savings over time:

$$
	ext{Total Savings} = \sum_{i=1}^{n} \text{Win}_i
$$

And for Smart Swaps:

$$
	ext{Yearly Saving} = (\text{Old Cost} - \text{New Cost}) \times 52
$$

We turn small daily changes into meaningful long-term impact.

## 🏗 How We Built It

Flourish was built with a modern, scalable stack:

**Frontend**

- React Native (Expo)
- TypeScript
- Expo Router
- RevenueCat (subscriptions)

**Backend**

- Firebase (Auth + Firestore)
- RevenueCat webhooks
- Gemini API for AI-powered features

**AI Integration**

We integrated Google Gemini to power:

- Smart Swap suggestions
- AI meal planning
- Investment explanations
- Context-aware chatbot

All AI responses are structured JSON, cached securely, and personalized using user profile data.

**Architecture Principles**

- Server-side validation for all premium features
- Centralized subscription gating
- Clean API contracts between frontend and backend
- Environment-based secret management
- Scalable database schema

## ⚡ Challenges We Ran Into

1. **Subscription Syncing**

	Keeping RevenueCat, Supabase, and frontend state perfectly aligned required careful webhook design and entitlement refresh logic.

2. **AI Structure & Safety**

	Ensuring Gemini returned structured outputs instead of unstructured text required careful prompt engineering and schema enforcement.

3. **Balancing Simplicity vs Power**

	We wanted the app to feel calm and minimal — but still technically robust. Design restraint was harder than adding features.

4. **Making Finance Feel Gentle**

	The biggest challenge wasn’t technical — it was emotional. We had to rethink how money apps feel.

## 🏆 Accomplishments We're Proud Of

- Built a fully authenticated backend using Firebase
- Integrated AI deeply into core workflows
- Created real subscription gating (not just UI locks)
- Designed an emotionally intelligent UX
- Built something that feels production-ready
- Created a demo-ready architecture judges can inspect

Most importantly:

We built a money app that feels supportive, not stressful.

## 📚 What We Learned

- Emotional design matters as much as technical architecture.
- AI is most powerful when context-aware.
- Subscription state should always live server-side.
- Clean API contracts reduce frontend complexity.
- Hackathon apps can — and should — be scalable.

We also learned that small financial wins compound:

$$
(1.05)^{12} \approx 1.795
$$

A 5% improvement monthly nearly doubles impact over time. That’s the philosophy behind Flourish.

## 🌼 What's Next for Flourish

- Community feed for sharing wins
- Monthly & seasonal savings challenges
- Family goal visualizations
- Smart grocery price tracking
- Investment portfolio tracking
- AI-driven personalized savings plans
- Push notifications for encouragement
- Web version for broader access

Long-term vision:

Flourish becomes the go-to financial confidence app for families worldwide.
