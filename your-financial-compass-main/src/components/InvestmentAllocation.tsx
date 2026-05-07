import { useEffect, useState } from "react";
import { PieChart, Pie, BarChart, Bar, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, Shield, Activity, Loader } from "lucide-react";
import { motion } from "framer-motion";
import {
  getMarketData,
  getOptimizedAllocation,
  type MarketData,
  type AllocationRecommendation,
} from "@/api/alphaVantageClient";

interface AllocationData {
  name: string;
  value: number;
  color: string;
}

interface InvestmentRecommendationProps {
  risk?: "low" | "medium" | "high";
  goalAmount?: number;
  timeframe?: number;
}

export const InvestmentAllocation = ({
  risk = "medium",
  goalAmount = 25000,
  timeframe = 12,
}: InvestmentRecommendationProps) => {
  const [step, setStep] = useState(0); // 0 = Input, 1 = Results
  const [monthlyInvestAmount, setMonthlyInvestAmount] = useState<number>(Math.round(goalAmount / (timeframe || 1)));
  const [investmentHorizon, setInvestmentHorizon] = useState<number>(timeframe);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [allocations, setAllocations] = useState<AllocationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch market data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getMarketData();
        setMarketData(data);

        // Get optimized allocations based on market data
        const optimized = getOptimizedAllocation(risk, data);
        setAllocations(optimized);
        setError(null);
      } catch (err) {
        console.error("Error fetching market data:", err);
        // Fallback to default allocations if API fails
        const fallback = getOptimizedAllocation(risk);
        setAllocations(fallback);
        setError("Using default recommendations (real-time data unavailable)");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [risk]);

  // Convert allocations to chart data format with colors
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];
  const allocationData: AllocationData[] = allocations.map((item, idx) => ({
    name: item.assetClass,
    value: item.allocation,
    color: colors[idx % colors.length],
  }));

  const riskLevel = {
    low: { label: "Conservative", color: "bg-green-500/20", textColor: "text-green-700", icon: "🛡️" },
    medium: { label: "Balanced", color: "bg-blue-500/20", textColor: "text-blue-700", icon: "⚖️" },
    high: { label: "Aggressive", color: "bg-red-500/20", textColor: "text-red-700", icon: "🚀" },
  };

  const current = riskLevel[risk];

  // Calculate projected returns (5% annual growth assumption)
  const totalInvestment = monthlyInvestAmount * investmentHorizon;
  const annualReturn = 0.05; // 5% annual growth
  const monthlyReturn = annualReturn / 12;
  const projectedValue = monthlyInvestAmount * (((1 + monthlyReturn) ** investmentHorizon - 1) / monthlyReturn);

  // Show loading state
  if (loading) {
    return (
      <div className="w-full space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="card-title">Recommended Allocation</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            <span className="text-sm">Fetching market data...</span>
          </div>
        </div>
        <div className="glass-card h-80 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Analyzing market conditions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 0: Input Form
  if (step === 0) {
    return (
      <div className="w-full space-y-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">Investment Planner</h2>
          <div className="text-xs font-semibold uppercase text-muted-foreground">Step 1/2</div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Investment Amount (₹)
            </label>
            <input
              type="number"
              min={100}
              value={monthlyInvestAmount || ""}
              onChange={(e) => setMonthlyInvestAmount(+e.target.value)}
              placeholder="5000"
              className="w-full rounded-xl border border-border bg-background px-5 py-4 font-mono text-base outline-none transition-all hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Investment Horizon (months)
            </label>
            <input
              type="number"
              min={1}
              max={360}
              value={investmentHorizon || ""}
              onChange={(e) => setInvestmentHorizon(+e.target.value)}
              placeholder="24"
              className="w-full rounded-xl border border-border bg-background px-5 py-4 font-mono text-base outline-none transition-all hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs text-muted-foreground">
              💡 Your portfolio will be allocated based on <span className="font-semibold">{current.label}</span> risk profile with real-time market optimization.
            </p>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={monthlyInvestAmount <= 0 || investmentHorizon <= 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            View Investment Results →
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Results
  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-title">Investment Results</h2>
        <div className="text-xs font-semibold uppercase text-muted-foreground">Step 2/2</div>
      </div>

      {/* Header with Market Data */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Recommended Allocation</h3>
          <div className={`${current.color} ${current.textColor} px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2`}>
            <span>{current.icon}</span>
            {current.label}
          </div>
        </div>
        
        {/* Market Data Row */}
        {marketData && (
          <div className="flex gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">VIX:</span>
              <span className={marketData.vix > 30 ? "text-red-500 font-semibold" : "text-green-500"}>{marketData.vix}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Trend:</span>
              <span className={
                marketData.trend === "bullish" ? "text-green-500" : 
                marketData.trend === "bearish" ? "text-red-500" : 
                "text-blue-500"
              }>{marketData.trend.toUpperCase()}</span>
            </div>
            {error && <span className="text-warning text-xs">{error}</span>}
          </div>
        )}
      </div>

      {/* Investment Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="text-xs text-muted-foreground mb-1">Monthly Investment</div>
          <div className="metric-number text-green-500 text-2xl">₹{monthlyInvestAmount.toLocaleString()}</div>
        </motion.div>

        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <div className="text-xs text-muted-foreground mb-1">Investment Period</div>
          <div className="metric-number text-blue-500 text-2xl">{investmentHorizon}mo</div>
        </motion.div>

        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
          <div className="metric-number text-orange-500 text-2xl">₹{totalInvestment.toLocaleString()}</div>
        </motion.div>

        <motion.div className="glass-card bg-primary/5 border-primary/20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div className="text-xs text-muted-foreground mb-1">Projected Value*</div>
          <div className="metric-number text-primary text-2xl">₹{Math.round(projectedValue).toLocaleString()}</div>
        </motion.div>
      </div>

      {/* Bar Chart Card */}
      <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={allocationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={110} tick={{fill: "hsl(var(--muted-foreground))", fontSize: 11}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  backgroundColor: "#1a1a2e",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#ffffff" }}
                formatter={(value: number) => `${value}%`}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Allocation Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Allocation Breakdown</h3>
        {allocations.map((item, idx) => {
          const investAmount = (monthlyInvestAmount * item.allocation) / 100;
          return (
            <motion.div
              key={item.assetClass}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: allocationData[idx]?.color }} />
                <div>
                  <div className="font-medium text-sm">{item.assetClass}</div>
                  <div className="text-xs text-muted-foreground">{item.rationale}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold" style={{ color: allocationData[idx]?.color }}>{item.allocation}%</div>
                <div className="text-xs text-muted-foreground">₹{investAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setStep(0)}
          className="flex-1 rounded-xl border border-border bg-background px-6 py-3 text-base font-semibold transition-all hover:bg-secondary"
        >
          Back
        </button>
        <button
          onClick={() => setStep(0)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-md"
        >
          ✓ Confirm Plan
        </button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          💡 <span className="font-semibold">Disclaimer:</span> *Projected value assumes 5% annual returns. Actual returns vary based on market conditions. Real-time data powered by Alpha Vantage API.
        </p>
      </div>
    </div>
  );
};

// Helper function to get emoji for asset class
const getEmoji = (assetClass: string): string => {
  const emojiMap: { [key: string]: string } = {
    "Government Bonds": "🏛️",
    "Corporate Bonds": "📋",
    "Dividend Stocks": "💰",
    "Large Cap Stocks": "📈",
    "Small Cap Growth": "🚀",
    "Growth Stocks": "📊",
    "Tech Equities": "💻",
    "Emerging Markets": "🌍",
    "International": "🌎",
    "Money Market": "💳",
    "Fixed Deposits": "🔒",
  };

  return emojiMap[assetClass] || "📊";
};
