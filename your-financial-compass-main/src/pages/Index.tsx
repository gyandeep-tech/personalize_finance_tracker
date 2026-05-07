import { useState, useEffect } from "react";
import { fetchAIPredictions } from "@/api/aiClient";
import { motion } from "framer-motion";
import { Sidebar, TopBar, type Tab } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { HealthGauge } from "@/components/HealthGauge";
import { IncomeExpenseChart, SpendingPie, ForecastChart } from "@/components/Charts";
import { GoalsCard } from "@/components/InsightCards";
import { ScenarioAnalysis } from "@/components/ScenarioAnalysis";
import { Onboarding } from "@/components/Onboarding";
import { LandingPage } from "@/components/LandingPage";
import { Chatbot } from "@/components/Chatbot";
import { useUserProfile, deriveFinance, UserProfileProvider } from "@/context/UserProfile";

const Dashboard = () => {
  const { profile } = useUserProfile();
  if (!profile) return null;
  const d = deriveFinance(profile);
  return (
    <>
      <div className="responsive-grid">
        <div className="lg:col-span-1 h-full"><HealthGauge score={d.healthScore} /></div>
        <div className="grid gap-7 md:gap-7 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:col-span-1">
          <StatCard label="Monthly Income" value={`₹${profile.income.toLocaleString()}`} delta={3.6} spark={[6,7,6,8,7,8,9]} />
          <StatCard label="Monthly Spending" value={`₹${profile.expenses.toLocaleString()}`} delta={-2.1} spark={[8,7,8,6,7,6,5]} />
          <StatCard label="Monthly Savings" value={`₹${d.monthlySavings.toLocaleString()}`} delta={+(d.savingsRate * 100).toFixed(1)} spark={[3,4,5,6,7,8,9]} />
          <StatCard label="Total Savings" value={`₹${profile.savings.toLocaleString()}`} delta={+(d.goalProgress * 100).toFixed(1)} spark={[5,6,5,7,6,8,9]} />
        </div>
      </div>
      <div className="mt-8 responsive-grid">
        <IncomeExpenseChart />
        <GoalsCard />
      </div>
      <div className="mt-8 responsive-grid">
        <SpendingPie />
        <ForecastChart />
      </div>
    </>
  );
};

const Spending = () => (
  <div className="responsive-grid">
    <SpendingPie />
    <IncomeExpenseChart />
  </div>
);



const Forecast = () => (
  <div className="grid gap-7 md:gap-7 sm:gap-6 grid-cols-1">
    <div>
      <h2 className="section-heading">Financial Forecast</h2>
      <p className="body-text text-muted-foreground mt-3">AI-powered predictions based on your income, expenses and goal</p>
    </div>
    <ForecastChart />
    <ScenarioAnalysis />
  </div>
);

const GoalsPage = () => {
  const { profile } = useUserProfile();
  if (!profile) return null;
  const d = deriveFinance(profile);
  return (
    <div className="grid gap-7 md:gap-7 sm:gap-6 grid-cols-1">
      <div>
        <h2 className="section-heading">Financial Goal</h2>
        <p className="body-text text-muted-foreground mt-3">Track your progress toward "{profile.goal.name}"</p>
      </div>
      <GoalsCard />
      <div className="grid gap-7 md:gap-7 sm:gap-6 grid-cols-1 md:grid-cols-3">
        <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px] flex flex-col justify-between">
          <div className="metric-label">Target</div>
          <div className="metric-number mt-4">₹{profile.goal.targetAmount.toLocaleString()}</div>
          <div className="body-text text-muted-foreground mt-3">in {profile.goal.targetMonths} months</div>
        </div>
        <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px] flex flex-col justify-between">
          <div className="metric-label">Saved</div>
          <div className="metric-number mt-4">₹{profile.savings.toLocaleString()}</div>
          <div className="body-text text-muted-foreground mt-3">{(d.goalProgress * 100).toFixed(1)}% complete</div>
        </div>
        <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px] flex flex-col justify-between">
          <div className="metric-label">Time to Goal</div>
          <div className="metric-number mt-4">{isFinite(d.monthsToGoal) ? `${d.monthsToGoal} mo` : "—"}</div>
          <div className={`body-text mt-3 ${d.onTrack ? "text-green-700" : "text-orange-700"}`}>
            {d.onTrack ? "On track" : "Behind target"}
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { profile, reset } = useUserProfile();
  if (!profile) return null;
  return (
    <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px]">
      <h2 className="card-title">Settings</h2>
      <p className="body-text text-muted-foreground mt-4">Your current profile.</p>
      <div className="mt-8 grid gap-6 md:gap-7 md:grid-cols-3">
        <Info label="Name" value={profile.name} />
        <Info label="Goal" value={profile.goal.name} />
        <Info label="Risk" value={profile.risk} />
        <Info label="Income / mo" value={`₹${profile.income.toLocaleString()}`} />
        <Info label="Expenses / mo" value={`₹${profile.expenses.toLocaleString()}`} />
        <Info label="Savings" value={`₹${profile.savings.toLocaleString()}`} />
      </div>
      <button
        onClick={reset}
        className="mt-8 rounded-card bg-primary px-7 py-4 font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:bg-primary/90 text-base md:text-lg"
      >
        Edit My Profile
      </button>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-card border border-border bg-secondary/30 p-5 md:p-6">
    <div className="metric-label">{label}</div>
    <div className="mt-3 body-text font-bold capitalize">{value}</div>
  </div>
);

const tabMeta: Record<Tab, { title: string; subtitle: string; render: () => JSX.Element }> = {
  dashboard: { title: "Dashboard", subtitle: "Your personalized financial overview", render: Dashboard },
  spending:  { title: "Spending",  subtitle: "How your monthly expenses break down", render: Spending },
  forecast:  { title: "Forecast",  subtitle: "Project the next 6 months & run scenarios", render: Forecast },
  goals:     { title: "Goals",     subtitle: "Stay on track to financial freedom", render: GoalsPage },
  settings:  { title: "Settings",  subtitle: "Personalize your advisor", render: SettingsPage },
};

const App = () => {
  const { profile, setAIPredictions } = useUserProfile();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [showLanding, setShowLanding] = useState(true);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchAIPredictions(profile).then((data) => {
        if (data) setAIPredictions(data);
      });
    }
  }, [profile, setAIPredictions]);

  if (!profile) {
    if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} />;
    return <Onboarding />;
  }

  const meta = tabMeta[tab];
  return (
    <div className={`min-h-screen transition-all duration-300 ${isSidebarExpanded ? "pl-64" : "pl-20"}`}>
      <Sidebar active={tab} onChange={setTab} isExpanded={isSidebarExpanded} onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} />
      <main className="mx-auto max-w-[1500px] px-6 py-8 md:px-10">
        <TopBar title={tab === 'dashboard' ? `Hello ${profile.name.split(' ')[0]}` : meta.title} subtitle={meta.subtitle} />
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {meta.render()}
        </motion.div>
      </main>
      <Chatbot />
    </div>
  );
};

const Index = () => (
  <UserProfileProvider>
    <App />
  </UserProfileProvider>
);

export default Index;
