import { UserProfile, AIPredictions } from "@/context/UserProfile";

export const fetchAIPredictions = async (profile: UserProfile): Promise<AIPredictions | null> => {
  const discretionary_spending = profile.expenses - profile.essential_spending;
  const monthly_savings = profile.income - profile.expenses;

  const payload = {
    monthly_income: profile.income,
    total_savings: profile.savings,
    monthly_savings: monthly_savings > 0 ? monthly_savings : 0,
    credit_score: profile.credit_score,
    emergency_fund: profile.emergency_fund,
    essential_spending: profile.essential_spending,
    discretionary_spending: discretionary_spending > 0 ? discretionary_spending : 0,
    budget_goal: profile.goal.targetAmount,
    financial_scenario: profile.financial_scenario,
  };

  try {
    const response = await fetch("http://localhost:8000/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Failed to fetch AI insights");
      return null;
    }

    const data = await response.json();
    return data as AIPredictions;
  } catch (error) {
    console.error("Error making request to AI Backend:", error);
    return null;
  }
};
