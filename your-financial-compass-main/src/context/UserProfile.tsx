import { createContext, useContext, useState, ReactNode } from "react";

export type RiskAppetite = "low" | "medium" | "high";

export interface UserGoal {
  name: string;
  targetAmount: number;
  targetMonths: number;
}

export interface UserProfile {
  name: string;
  goal: UserGoal;
  income: number;       // monthly
  expenses: number;     // monthly
  savings: number;      // current total savings
  risk: RiskAppetite;
  credit_score: number;
  essential_spending: number;
  emergency_fund: number;
  financial_scenario: string;
  ai_optimization: boolean;
  preferred_sectors: string[];
}

export interface AIPredictions {
  metrics: {
    savings_rate: number;
    runway_months: number;
    discretionary_ratio: number;
    savings_to_goal_ratio: number;
  };
  ai_insights: {
    portfolio: string;
    purchase_timing: string;
    behavior: string;
    tax: string;
    loan_advisory: string;
  };
}

interface Ctx {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  reset: () => void;
  aiPredictions: AIPredictions | null;
  setAIPredictions: (p: AIPredictions | null) => void;
}

const UserProfileContext = createContext<Ctx | null>(null);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [aiPredictions, setAIPredictions] = useState<AIPredictions | null>(null);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        setProfile: setProfileState,
        reset: () => { setProfileState(null); setAIPredictions(null); },
        aiPredictions,
        setAIPredictions,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
};

// ---------- Derived analytics ----------

export interface DerivedFinance {
  monthlySavings: number;
  savingsRate: number; // 0..1
  monthsToGoal: number;
  goalProgress: number; // 0..1 (current savings / target)
  onTrack: boolean;
  healthScore: number; // 0..100
  spendingBreakdown: { name: string; value: number; color: string }[];
  monthly: { month: string; income: number; expenses: number }[];
  forecast: { month: string; income: number; expenses: number; savings: number }[];
}

const palette = [
  "hsl(222, 89%, 62%)",
  "hsl(256, 90%, 68%)",
  "hsl(170, 76%, 50%)",
  "hsl(32, 96%, 56%)",
  "hsl(0, 84%, 62%)",
  "hsl(290, 80%, 65%)",
];

// Typical share-of-wallet by category (sums to 1)
const categoryShares = [
  { name: "Housing", share: 0.34 },
  { name: "Food", share: 0.18 },
  { name: "Transport", share: 0.12 },
  { name: "Entertainment", share: 0.09 },
  { name: "Healthcare", share: 0.09 },
  { name: "Shopping", share: 0.18 },
];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const futureLabels = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export const deriveFinance = (p: UserProfile): DerivedFinance => {
  const monthlySavings = Math.max(0, p.income - p.expenses);
  const savingsRate = p.income > 0 ? monthlySavings / p.income : 0;
  const remaining = Math.max(0, p.goal.targetAmount - p.savings);
  const monthsToGoal = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : Infinity;
  const goalProgress = p.goal.targetAmount > 0 ? Math.min(1, p.savings / p.goal.targetAmount) : 0;
  const onTrack = monthsToGoal <= p.goal.targetMonths;

  // Health score from savings rate, goal trajectory, expense ratio
  const expenseRatio = p.income > 0 ? p.expenses / p.income : 1;
  const rateScore = Math.min(1, savingsRate / 0.3) * 40;
  const trackScore = onTrack ? 35 : Math.max(0, 35 * (p.goal.targetMonths / Math.max(1, monthsToGoal)));
  const expScore = Math.max(0, 25 * (1 - Math.min(1, expenseRatio)));
  const healthScore = Math.round(Math.max(5, Math.min(100, rateScore + trackScore + expScore)));

  const spendingBreakdown = categoryShares.map((c, i) => ({
    name: c.name,
    value: Math.round(p.expenses * c.share),
    color: palette[i % palette.length],
  }));

  const monthly = monthLabels.map((m, i) => {
    const wobble = 1 + (Math.sin(i * 1.3) * 0.06);
    return {
      month: m,
      income: Math.round(p.income * wobble),
      expenses: Math.round(p.expenses * (1 + Math.cos(i * 0.9) * 0.05)),
    };
  });

  const forecast = futureLabels.map((m, i) => {
    const inc = Math.round(p.income * (1 + i * 0.01));
    const exp = Math.round(p.expenses * (1 + i * 0.005));
    return { month: m, income: inc, expenses: exp, savings: inc - exp };
  });

  return {
    monthlySavings,
    savingsRate,
    monthsToGoal,
    goalProgress,
    onTrack,
    healthScore,
    spendingBreakdown,
    monthly,
    forecast,
  };
};
