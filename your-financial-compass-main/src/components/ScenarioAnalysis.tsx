import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useUserProfile, deriveFinance } from "@/context/UserProfile";

export const ScenarioAnalysis = () => {
  const { profile } = useUserProfile();
  const [income, setIncome] = useState(5);
  const [expense, setExpense] = useState(1);
  const [shown, setShown] = useState({ income: 5, expense: 1 });

  if (!profile) return null;
  const d = deriveFinance(profile);
  const newIncome = profile.income * (1 + shown.income / 100);
  const newExpense = profile.expenses * (1 + shown.expense / 100);
  const newSavings = Math.max(0, Math.round(newIncome - newExpense));
  const remaining = Math.max(0, profile.goal.targetAmount - profile.savings);
  const newMonths = newSavings > 0 ? Math.ceil(remaining / newSavings) : Infinity;
  const newGoalPct = Math.min(100, ((profile.savings + newSavings * 6) / profile.goal.targetAmount) * 100);

  return (
    <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px]">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <TrendingUp className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="card-title">What-If Scenario Analysis</h3>
      </div>
      
      <div className="grid gap-6 md:gap-7 md:grid-cols-2 mb-8">
        <div>
          <label className="metric-label block mb-3">Income Change (%)</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(+e.target.value)}
            className="w-full rounded-card border border-border bg-secondary/40 px-5 py-4 font-mono text-lg md:text-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div>
          <label className="metric-label block mb-3">Expense Change (%)</label>
          <input
            type="number"
            value={expense}
            onChange={(e) => setExpense(+e.target.value)}
            className="w-full rounded-card border border-border bg-secondary/40 px-5 py-4 font-mono text-lg md:text-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <button
        onClick={() => setShown({ income, expense })}
        className="w-full rounded-card bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-6 font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] text-base md:text-lg"
      >
        Run Scenario Analysis
      </button>

      <motion.div
        key={`${shown.income}-${shown.expense}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-card border border-border/60 bg-secondary/30 p-6 md:p-8"
      >
        <div className="body-text font-semibold mb-6">
          Income {shown.income >= 0 ? "+" : ""}{shown.income}%, Expenses {shown.expense >= 0 ? "+" : ""}{shown.expense}%
        </div>
        <div className="grid gap-8 md:gap-10 md:grid-cols-3">
          <div>
            <div className="metric-label mb-3">New Monthly Savings</div>
            <div className="metric-number text-green-600">₹{newSavings.toLocaleString()}</div>
            <div className="mt-2 body-text text-muted-foreground">Was ₹{d.monthlySavings.toLocaleString()}</div>
          </div>
          <div>
            <div className="metric-label mb-3">Time to Goal</div>
            <div className="metric-number text-blue-600">
              {isFinite(newMonths) ? `${newMonths} mo` : "—"}
            </div>
            <div className="mt-2 body-text text-muted-foreground">Target {profile.goal.targetMonths} mo</div>
          </div>
          <div>
            <div className="metric-label mb-3">"{profile.goal.name}" in 6 mo</div>
            <div className="metric-number gradient-text">{newGoalPct.toFixed(1)}%</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
