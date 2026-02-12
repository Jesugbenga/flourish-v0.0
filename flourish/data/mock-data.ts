import type {
  DailyTip,
  QuickAction,
  SmartSwapItem,
  MealPlan,
  BudgetCategory,
  SavingsWin,
  ChallengeDay,
  Lesson,
  CommunityPost,
  UserProfile,
  RebeccaPost,
} from '@/types';

// ─── User Profile ──────────────────────────────────────────────────────

export const userProfile: UserProfile = {
  name: '',
  totalSavings: 0,
  swapSavings: 0,
  mealSavings: 0,
  budgetSavings: 0,
  challengeSavings: 0,
  streak: 0,
  joinDate: '2025-12-01',
};

// ─── Daily Tips ────────────────────────────────────────────────────────

export const dailyTips: DailyTip[] = [
  {
    id: '1',
    title: 'Small swap, big save',
    body: 'Switching one branded item this week could save you £5–£10.',
    category: 'swap',
    savingsEstimate: '£5–£10/week',
  },
  {
    id: '2',
    title: 'Batch cook Sunday',
    body: 'Cooking one big meal on Sunday saves 3 takeaway temptations.',
    category: 'meal',
    savingsEstimate: '£15–£25/week',
  },
  {
    id: '3',
    title: 'The latte factor',
    body: 'Making coffee at home 3 days a week saves roughly £12.',
    category: 'general',
    savingsEstimate: '£12/week',
  },
];

// ─── Quick Actions ─────────────────────────────────────────────────────

export const quickActions: QuickAction[] = [
  {
    id: '1',
    title: 'Smart Swap',
    subtitle: 'Find cheaper alternatives',
    icon: 'swap-horizontal',
    route: '/smart-swap',
    color: '#8AAE92',
  },
  {
    id: '2',
    title: 'Meal Planner',
    subtitle: 'Save on food this week',
    icon: 'restaurant',
    route: '/meal-planner',
    color: '#D4A843',
  },
  {
    id: '3',
    title: 'To-do List',
    subtitle: 'Track all your tasks',
    icon: 'checkmark-done',
    route: '/todo',
    color: '#7EAAB0',
  },
  {
    id: '4',
    title: 'Chat with Flo',
    subtitle: 'Ask about savings and ideas',
    icon: 'chatbubbles',
    route: '/chat',
    color: '#A98FC6',
  },
];

// ─── Smart Swaps ───────────────────────────────────────────────────────

export const smartSwaps: SmartSwapItem[] = [
  {
    id: '1',
    originalItem: 'Fairy Washing Up Liquid',
    originalPrice: 2.5,
    alternative: 'Aldi Magnum Washing Up Liquid',
    alternativePrice: 0.89,
    savingsWeekly: 1.61,
    savingsYearly: 83.72,
    confidence: 92,
  },
  {
    id: '2',
    originalItem: "Kellogg's Corn Flakes (500g)",
    originalPrice: 3.2,
    alternative: 'Asda Just Essentials Corn Flakes',
    alternativePrice: 0.65,
    savingsWeekly: 2.55,
    savingsYearly: 132.6,
    confidence: 88,
  },
  {
    id: '3',
    originalItem: 'Persil Bio Capsules (30 pack)',
    originalPrice: 8.5,
    alternative: 'Lidl Formil Bio Capsules',
    alternativePrice: 3.49,
    savingsWeekly: 1.67,
    savingsYearly: 86.84,
    confidence: 90,
  },
  {
    id: '4',
    originalItem: 'Andrex Toilet Tissue (9 pack)',
    originalPrice: 5.5,
    alternative: 'Aldi Saxon Soft Toilet Tissue',
    alternativePrice: 2.85,
    savingsWeekly: 0.88,
    savingsYearly: 45.76,
    confidence: 85,
  },
];

// ─── Meal Plans ────────────────────────────────────────────────────────

export const mealPlans: MealPlan[] = [
  {
    id: '1',
    name: 'One-Pot Chicken Pasta',
    costPerServing: 1.85,
    savingsVsTakeout: 6.15,
    prepTime: '25 min',
    tags: ['Quick', 'Family Favourite'],
    ingredients: [
      'Chicken breast',
      'Pasta',
      'Tinned tomatoes',
      'Onion',
      'Garlic',
      'Mixed herbs',
    ],
    steps: [
      'Dice chicken and onion',
      'Fry chicken until golden',
      'Add onion, garlic, tomatoes',
      'Add pasta and water, simmer 15 min',
    ],
  },
  {
    id: '2',
    name: 'Veggie Stir Fry',
    costPerServing: 1.2,
    savingsVsTakeout: 7.8,
    prepTime: '15 min',
    tags: ['Quick', 'Vegetarian'],
    ingredients: ['Rice', 'Mixed veg', 'Soy sauce', 'Garlic', 'Ginger', 'Sesame oil'],
    steps: [
      'Cook rice',
      'Stir fry veg with garlic and ginger',
      'Add soy sauce',
      'Serve over rice',
    ],
  },
  {
    id: '3',
    name: 'Bean Chilli',
    costPerServing: 0.95,
    savingsVsTakeout: 8.05,
    prepTime: '30 min',
    tags: ['Batch Cook', 'High Protein'],
    ingredients: [
      'Kidney beans',
      'Black beans',
      'Tinned tomatoes',
      'Onion',
      'Chilli powder',
      'Rice',
    ],
    steps: ['Fry onion', 'Add beans, tomatoes, spices', 'Simmer 20 min', 'Serve with rice'],
  },
];

// ─── Budget Categories ─────────────────────────────────────────────────

export const budgetCategories: BudgetCategory[] = [
  { id: '1', name: 'Groceries', allocated: 400, spent: 342, icon: 'cart' },
  { id: '2', name: 'Transport', allocated: 150, spent: 128, icon: 'car' },
  { id: '3', name: 'Bills', allocated: 600, spent: 580, icon: 'flash' },
  { id: '4', name: 'Kids', allocated: 200, spent: 165, icon: 'heart' },
  { id: '5', name: 'Personal', allocated: 100, spent: 72, icon: 'person' },
  { id: '6', name: 'Savings', allocated: 150, spent: 150, icon: 'leaf' },
];

// ─── Recent Wins ───────────────────────────────────────────────────────

export const recentWins: SavingsWin[] = [];

// ─── 7-Day Challenge ───────────────────────────────────────────────────

export const challengeDays: ChallengeDay[] = [
  { day: 1, title: 'Audit your fridge', description: 'Take stock of what you have before shopping. Plan meals around it.', completed: false, savingsEstimate: '£5' },
  { day: 2, title: 'Swap one item', description: 'Replace one branded product with a store-brand alternative.', completed: false, savingsEstimate: '£2' },
  { day: 3, title: 'No-spend evening', description: 'Plan a free family evening instead of ordering takeaway.', completed: false, savingsEstimate: '£12' },
  { day: 4, title: 'Meal prep one lunch', description: "Make tomorrow's lunch tonight instead of buying.", completed: false, savingsEstimate: '£6' },
  { day: 5, title: 'Energy check', description: 'Turn off standby devices and check your thermostat.', completed: false, savingsEstimate: '£3' },
  { day: 6, title: 'Subscription audit', description: 'Review one subscription — do you still need it?', completed: false, savingsEstimate: '£10' },
  { day: 7, title: 'Share your win', description: 'Tell someone about a saving you made this week.', completed: false, savingsEstimate: '£0' },
];

// ─── Lessons ───────────────────────────────────────────────────────────

export const lessons: Lesson[] = [
  {
    id: '1',
    title: 'What investing really is',
    subtitle: "It's simpler than you think",
    icon: 'bulb',
    cards: [
      {
        title: 'Not just for the wealthy',
        body: 'Investing simply means putting money somewhere it can grow over time. Even £5 a month counts.',
      },
      {
        title: 'How it works',
        body: 'When you invest, your money earns returns. Those returns earn more returns. This is called compound growth.',
      },
      {
        title: 'The key thing',
        body: 'Time is more important than amount. Starting small today beats waiting for a "perfect" moment.',
      },
    ],
  },
  {
    id: '2',
    title: 'How money grows',
    subtitle: 'The magic of compound interest',
    icon: 'trending-up',
    cards: [
      {
        title: 'Think of it like planting',
        body: "Put £50/month away. In 10 years at 5% growth, you'd have about £7,800. You only put in £6,000.",
      },
      {
        title: 'The earlier, the better',
        body: 'Starting 5 years earlier could mean thousands more. Time does the heavy lifting.',
      },
      {
        title: "It's not about being rich",
        body: "It's about building a safety net for your family, one small step at a time.",
      },
    ],
  },
  {
    id: '3',
    title: 'Getting started safely',
    subtitle: 'Your first steps',
    icon: 'shield-checkmark',
    cards: [
      {
        title: 'Emergency fund first',
        body: 'Before investing, try to save 1–3 months of essential expenses. Start with whatever you can.',
      },
      {
        title: 'ISAs are your friend',
        body: 'A Stocks & Shares ISA lets your money grow tax-free. Many start from £1.',
      },
      {
        title: 'Keep it simple',
        body: 'A global index fund spreads your money across thousands of companies. Low risk, steady growth.',
      },
    ],
  },
];

// ─── Community Posts ───────────────────────────────────────────────────

export const communityPosts: CommunityPost[] = [
  {
    id: '1',
    author: 'Sarah M.',
    content: 'Switched to Aldi for weekly shop — saved £23 this week! 🎉',
    savings: 23,
    likes: 14,
    timeAgo: '2h ago',
  },
  {
    id: '2',
    author: 'Priya K.',
    content: 'Batch cooking Sundays is a game changer. Fed the family for £18.',
    savings: 18,
    likes: 22,
    timeAgo: '5h ago',
  },
  {
    id: '3',
    author: 'Emma T.',
    content: 'Cancelled a subscription I forgot about. £9.99/month saved!',
    savings: 9.99,
    likes: 31,
    timeAgo: '1d ago',
  },
  {
    id: '4',
    author: 'Lisa J.',
    content: "Made packed lunches all week. Kids didn't even complain! £15 saved.",
    savings: 15,
    likes: 18,
    timeAgo: '1d ago',
  },
  {
    id: '5',
    author: 'Chloe R.',
    content: "Used Flourish's meal planner for the first time. So easy and saved £12.",
    savings: 12,
    likes: 9,
    timeAgo: '2d ago',
  },
];

// ─── Rebecca's Corner ──────────────────────────────────────────────────

export const rebeccasCornerPosts: RebeccaPost[] = [
  {
    id: '1',
    title: 'Why I started Flourish',
    body: 'As a mum of two, I know how overwhelming money decisions feel. Flourish was born from wanting something that helps without judging.',
    date: '2026-01-15',
  },
  {
    id: '2',
    title: 'The £5 rule that changed everything',
    body: "Every time I was about to impulse buy, I'd wait 24 hours. If I still wanted it, I'd buy it. I saved over £200 in a month.",
    date: '2026-01-28',
  },
  {
    id: '3',
    title: "You're doing better than you think",
    body: "If you opened this app today, you're already making a choice for your family. That matters more than any number on a screen.",
    date: '2026-02-05',
  },
];
