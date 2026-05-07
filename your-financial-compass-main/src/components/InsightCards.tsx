import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Target } from "lucide-react";
import { useUserProfile, deriveFinance, type RiskAppetite } from "@/context/UserProfile";

const toneMap = {
  success: { icon: TrendingUp, bg: "bg-green-100", text: "text-green-700" },
  primary: { icon: Sparkles, bg: "bg-slate-100", text: "text-slate-800" },
  warning: { icon: AlertTriangle, bg: "bg-orange-100", text: "text-orange-700" },
};

type Tone = keyof typeof toneMap;

const buildInsights = (profile: ReturnType<typeof useUserProfile>["profile"]) => {
  if (!profile) return [];
  const d = deriveFinance(profile);
  const items: { tone: Tone; title: string; body: string; cta: string }[] = [];

  if (d.savingsRate >= 0.25) {
    items.push({
      tone: "success",
      title: "Strong Savings Rate",
      body: `You're saving ${(d.savingsRate * 100).toFixed(1)}% of your income — that's ₹${d.monthlySavings.toLocaleString()} every month toward "${profile.goal.name}".`,
      cta: "Keep going",
    });
  } else if (d.savingsRate > 0) {
    items.push({
      tone: "warning",
      title: "Savings Rate Below Target",
      body: `Your savings rate is only ${(d.savingsRate * 100).toFixed(1)}%. Aim for at least 20% to reach "${profile.goal.name}" comfortably.`,
      cta: "See plan",
    });
  } else {
    items.push({
      tone: "warning",
      title: "Expenses Exceed Income",
      body: `You're spending more than you earn. Cut expenses by ₹${(profile.expenses - profile.income).toLocaleString()} to start saving for "${profile.goal.name}".`,
      cta: "Fix budget",
    });
  }

  if (d.onTrack) {
    items.push({
      tone: "success",
      title: "Goal On Track",
      body: `At your current pace you'll reach "${profile.goal.name}" in ${d.monthsToGoal} months — within your ${profile.goal.targetMonths}-month target.`,
      cta: "View forecast",
    });
  } else {
    const need = profile.goal.targetMonths > 0
      ? Math.ceil((profile.goal.targetAmount - profile.savings) / profile.goal.targetMonths)
      : 0;
    items.push({
      tone: "primary",
      title: "Adjust to Hit Your Goal",
      body: `To hit "${profile.goal.name}" in ${profile.goal.targetMonths} months you need to save ₹${need.toLocaleString()}/month — currently saving ₹${d.monthlySavings.toLocaleString()}.`,
      cta: "Run scenario",
    });
  }

  return items;
};

export const AIInsights = () => {
  const { aiPredictions } = useUserProfile();
  
  if (!aiPredictions) {
    return (
      <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px] flex flex-col items-center justify-center">
        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
        <p className="mt-6 body-text text-muted-foreground text-center">Running Analysis...</p>
      </div>
    );
  }

  const { ai_insights } = aiPredictions;
  const insights = [
    { tone: "primary" as Tone, title: "Portfolio Strategy", body: ai_insights.portfolio, cta: "Review Strategy" },
    { tone: "warning" as Tone, title: "Loan Health", body: ai_insights.loan_advisory, cta: "Check Risk" },
    { tone: "success" as Tone, title: "Purchase Advisor", body: ai_insights.purchase_timing, cta: "Plan Purchase" },
    { tone: "warning" as Tone, title: "Behavioral Analysis", body: ai_insights.behavior, cta: "See Breakdown" },
    { tone: "primary" as Tone, title: "Tax Optimization", body: ai_insights.tax, cta: "Tax Hub" },
  ];

  return (
    <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px] flex flex-col">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-orange-100 text-orange-600 flex-shrink-0">
          <Sparkles className="h-7 w-7" />
        </div>
        <h3 className="card-title">Smart Insights</h3>
      </div>
      <div className="scrollbar-thin -mr-2 flex flex-1 flex-col gap-5 overflow-y-auto pr-3">
        {insights.map((it, idx) => {
          const t = toneMap[it.tone];
          const Icon = t.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="rounded-card border border-border bg-background p-6 md:p-7 transition-all hover:shadow-md"
            >
              <div className="flex gap-5">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[12px] ${t.bg}`}>
                  <Icon className={`h-7 w-7 ${t.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="card-title text-[20px] md:text-[22px]">{it.title}</div>
                  <p className="mt-3 body-text leading-relaxed text-muted-foreground">{it.body}</p>
                  <button className={`mt-4 inline-flex items-center gap-2 text-base md:text-lg font-bold uppercase tracking-wider ${t.text} hover:opacity-80 transition-opacity`}>
                    {it.cta} <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const riskColor = (risk: string) =>
  risk === "HIGH"
    ? "bg-red-100 text-red-700"
    : risk === "MEDIUM"
    ? "bg-orange-100 text-orange-700"
    : "bg-green-100 text-green-700";

// Goal-driven advisor recommendations
const buildGoalAdvice = (profile: NonNullable<ReturnType<typeof useUserProfile>["profile"]>) => {
  const d = deriveFinance(profile);
  const required = profile.goal.targetMonths > 0
    ? Math.ceil((profile.goal.targetAmount - profile.savings) / profile.goal.targetMonths)
    : 0;
  const gap = required - d.monthlySavings;
  const horizon = profile.goal.targetMonths;

  // Pick allocation by risk + horizon
  const allocations: Record<RiskAppetite, { ticker: string; name: string; risk: string; desc: string; ret: number; alloc: number }[]> = {
    low: [
      { ticker: "BND", name: "Bond Index", risk: "LOW", desc: "Capital preservation while you save", ret: 3.5, alloc: 50 },
      { ticker: "HYSA", name: "High-Yield Savings", risk: "LOW", desc: "Liquid funds for short-term goals", ret: 4.5, alloc: 30 },
      { ticker: "VTI", name: "Total Market Index", risk: "MEDIUM", desc: "Light equity exposure for growth", ret: 8.5, alloc: 20 },
    ],
    medium: [
      { ticker: "VTI", name: "Total Market Index", risk: "MEDIUM", desc: "Broad market growth toward your goal", ret: 8.5, alloc: 45 },
      { ticker: "VXUS", name: "International Stock ETF", risk: "MEDIUM", desc: "Geographic diversification", ret: 7.0, alloc: 25 },
      { ticker: "BND", name: "Bond Index", risk: "LOW", desc: "Stabilizes returns near goal date", ret: 3.5, alloc: 30 },
    ],
    high: [
      { ticker: "QQQ", name: "Tech Growth ETF", risk: "HIGH", desc: "Aggressive growth to accelerate your goal", ret: 12.5, alloc: 45 },
      { ticker: "VTI", name: "Total Market Index", risk: "MEDIUM", desc: "Core diversified equity holding", ret: 8.5, alloc: 35 },
      { ticker: "VXUS", name: "International Stock ETF", risk: "MEDIUM", desc: "International growth exposure", ret: 7.0, alloc: 20 },
    ],
  };

  // For very short horizon, prefer cash even if higher risk chosen
  const list = horizon <= 12
    ? allocations.low
    : horizon <= 36 && profile.risk === "high"
    ? allocations.medium
    : allocations[profile.risk];

  return { required, gap, list, derived: d };
};

export const Recommendations = () => {
  const { profile } = useUserProfile();
  if (!profile) return null;
  const { required, gap, list, derived } = buildGoalAdvice(profile);
  const onTrack = gap <= 0;

  return (
    <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px]">
      <div className="mb-8 flex items-center gap-4 flex-wrap">
        <Target className="h-9 w-9 text-primary flex-shrink-0" />
        <h3 className="card-title">
          Strategy for: <span className="text-primary">{profile.goal.name}</span>
        </h3>
      </div>

      <div className="mb-8 grid gap-6 md:gap-7 md:grid-cols-3">
        <SummaryTile label="Target" value={`₹${profile.goal.targetAmount.toLocaleString()}`} sub={`${profile.goal.targetMonths} months`} />
        <SummaryTile label="Required / month" value={`₹${required.toLocaleString()}`} sub={`Currently ₹${derived.monthlySavings.toLocaleString()}`} />
        <SummaryTile
          label="Status"
          value={onTrack ? "On Track" : `Gap ₹${gap.toLocaleString()}`}
          sub={onTrack ? "Maintain pace" : "Increase income or cut expenses"}
          tone={onTrack ? "success" : "warning"}
        />
      </div>

      <div className="metric-label mb-6 border-b border-border pb-4">
        Recommended Allocation ({profile.risk} risk, {profile.goal.targetMonths}-month horizon)
      </div>
      <div className="space-y-6">
        {list.map((r, i) => (
          <motion.div
            key={r.ticker}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8 rounded-card border border-border bg-background p-7 md:p-8 transition-all hover:shadow-md"
          >
            <div className="flex-1 min-w-0">
              <div className="card-title text-[22px]">
                {r.ticker} – {r.name}
              </div>
              <span className={`mt-4 inline-block rounded-lg px-3 py-1.5 text-sm md:text-base font-bold tracking-wider ${riskColor(r.risk)}`}>
                {r.risk} RISK
              </span>
              <p className="mt-4 body-text leading-relaxed text-muted-foreground">{r.desc}</p>
              <div className="mt-4 text-base md:text-lg font-semibold text-green-700">Expected Return: +{r.ret}%</div>
            </div>
            <div className="md:ml-6 md:text-right flex gap-8 md:flex-col md:gap-4">
              <div>
                <div className="metric-number text-primary text-[clamp(32px,_5vw,_40px)]">{r.alloc}%</div>
                <div className="metric-label mt-2">Allocation</div>
              </div>
              <div>
                <div className="body-text font-bold md:text-lg text-foreground">
                  ₹{Math.round((derived.monthlySavings * r.alloc) / 100).toLocaleString()}/mo
                </div>
                <div className="metric-label mt-1">Per Month</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SummaryTile = ({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "success" | "warning";
}) => (
  <div className="rounded-card border border-border bg-background p-6 md:p-7 md:min-h-[140px] flex flex-col justify-between">
    <div className="metric-label mb-4">{label}</div>
    <div>
      <div
        className={`metric-number text-[clamp(24px,_4vw,_32px)] ${
          tone === "success" ? "text-green-700" : tone === "warning" ? "text-orange-700" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-3 body-text text-muted-foreground">{sub}</div>
    </div>
  </div>
);

export const GoalsCard = () => {
  const { profile } = useUserProfile();
  if (!profile) return null;
  const d = deriveFinance(profile);
  const pct = d.goalProgress * 100;
  return (
    <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px]">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-blue-100">
          <Lightbulb className="h-7 w-7 text-blue-600" />
        </div>
        <h3 className="metric-label">Your Goal</h3>
      </div>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="card-title">{profile.goal.name}</div>
            <div className="body-text font-semibold text-muted-foreground mt-3">
              ₹{profile.savings.toLocaleString()} / ₹{profile.goal.targetAmount.toLocaleString()}
            </div>
          </div>
          <div className="metric-number text-primary text-[clamp(28px,_5vw,_36px)] flex-shrink-0">{pct.toFixed(1)}%</div>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Mini label="Saving" value={`₹${d.monthlySavings.toLocaleString()}/mo`} />
          <Mini label="Time to Goal" value={isFinite(d.monthsToGoal) ? `${d.monthsToGoal} mo` : "—"} />
          <Mini label="Target Date" value={`${profile.goal.targetMonths} mo`} />
        </div>
      </div>
    </div>
  );
};

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-card border border-border bg-background p-4 md:p-5 overflow-hidden min-w-0">
    <div className="metric-label mb-2 md:mb-3 truncate" title={label}>{label}</div>
    <div className="text-lg md:text-xl font-bold text-foreground truncate" title={value}>{value}</div>
  </div>
);
