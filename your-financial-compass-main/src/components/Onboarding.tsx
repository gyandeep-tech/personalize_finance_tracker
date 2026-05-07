import { useState } from "react";
import { Target, Wallet, ArrowRight, Activity, BarChart2, Check } from "lucide-react";
import { useUserProfile, type RiskAppetite } from "@/context/UserProfile";
import { InvestmentAllocation } from "./InvestmentAllocation";

export const Onboarding = () => {
  const { setProfile } = useUserProfile();
  const [step, setStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [targetMonths, setTargetMonths] = useState<number>(12);
  const [income, setIncome] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [savings, setSavings] = useState<number>(0);
  const [risk, setRisk] = useState<RiskAppetite>("medium");

  const [creditScore, setCreditScore] = useState<number>(720);
  const [financialScenario, setFinancialScenario] = useState<string>("normal");
  const [aiOptimization, setAiOptimization] = useState<boolean>(true);
  const [preferredSectors, setPreferredSectors] = useState<string[]>([]);

  const sectorsList = ["Technology", "Healthcare", "Real Estate", "Crypto", "Bonds", "ESG/Green"];

  const next = () => { setErrorMsg(""); setStep((s) => s + 1); };
  const back = () => { setErrorMsg(""); setStep((s) => Math.max(0, s - 1)); };

  const submit = () =>
    setProfile({
      name: name || "You",
      goal: { name: goalName || "My Goal", targetAmount, targetMonths },
      income,
      expenses,
      savings,
      risk,
      credit_score: creditScore,
      essential_spending: 0, // removed field
      emergency_fund: 0,     // removed field
      financial_scenario: financialScenario,
      ai_optimization: aiOptimization,
      preferred_sectors: preferredSectors,
    });

  const canNext0 = goalName.trim().length > 0 && targetAmount > 0 && targetMonths > 0;
  const canNext1 = income > 0 && expenses > 0 && savings > 0;

  const handleNext0 = () => {
    if (canNext0) next();
    else setErrorMsg("Please fill all empty spaces.");
  };

  const handleNext1 = () => {
    if (canNext1) next();
    else setErrorMsg("Please fill all empty spaces.");
  };

  const handleSubmit = () => {
    if (canNext1) submit(); // Using canNext1 logic for final check just in case
    else submit(); // Though step 3 has no text fields typically
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-background text-foreground">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">FINOVA SETUP</div>
            <h1 className="font-display text-3xl font-bold">Build your AI financial plan</h1>
          </div>
        </div>

        <div className="mb-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-secondary"}`}
            />
          ))}
        </div>

        {/* Step 0: Two Column Layout */}
        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Goal Setup Form */}
            <div className="h-[650px] bg-card border border-border rounded-xl shadow-soft p-8 md:p-10 flex flex-col space-y-8 overflow-y-auto">
              <div className="flex items-center gap-3 text-base font-semibold text-primary">
                <Target className="h-5 w-5" /> Step 1 — Your Goal
              </div>
              <Field label="Your Name (optional)">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Elena" className={inputCls} />
              </Field>
              <Field label="What do you want to buy / achieve?">
                <input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Buy a car, House down payment, Trip to Japan"
                  className={inputCls}
                />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Target Amount (₹)">
                  <input
                    type="number"
                    min={0}
                    value={targetAmount || ""}
                    onChange={(e) => setTargetAmount(+e.target.value)}
                    placeholder="25000"
                    className={inputCls}
                  />
                </Field>
                <Field label="Target Timeframe (months)">
                  <input
                    type="number"
                    min={1}
                    value={targetMonths || ""}
                    onChange={(e) => setTargetMonths(+e.target.value)}
                    placeholder="18"
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="mt-auto">
                {errorMsg && <div className="text-red-500 font-semibold mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{errorMsg}</div>}
                <Nav onNext={handleNext0} canNext={true} />
              </div>
            </div>

            {/* Right Column: Investment Allocation */}
            <div className="h-[650px] bg-card border border-border rounded-xl shadow-soft p-4 md:p-6 overflow-y-auto">
              <InvestmentAllocation risk={risk} goalAmount={targetAmount} timeframe={targetMonths} />
            </div>
          </div>
        )}


        {step === 1 && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-soft p-10 space-y-8">
            <div className="flex items-center gap-3 text-base font-semibold text-primary">
              <Wallet className="h-5 w-5" /> Step 2 — Your Finances
            </div>
            <div className="grid gap-5 grid-cols-3">
              <Field label="Monthly Income">
                <input type="number" min={0} value={income || ""} onChange={(e) => setIncome(+e.target.value)} placeholder="₹8500" className={inputCls} />
              </Field>
              <Field label="Monthly Expenses">
                <input type="number" min={0} value={expenses || ""} onChange={(e) => setExpenses(+e.target.value)} placeholder="₹5200" className={inputCls} />
              </Field>
              <Field label="Current Savings">
                <input type="number" min={0} value={savings || ""} onChange={(e) => setSavings(+e.target.value)} placeholder="₹15000" className={inputCls} />
              </Field>
            </div>
            
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Credit Score">
                <input type="number" min={300} max={850} value={creditScore || ""} onChange={(e) => setCreditScore(+e.target.value)} placeholder="720" className={inputCls} />
              </Field>
              <Field label="Economy State">
                <select value={financialScenario} onChange={(e) => setFinancialScenario(e.target.value)} className={inputCls}>
                  <option value="normal">Normal</option>
                  <option value="recession">Recession</option>
                  <option value="growth">Growth</option>
                </select>
              </Field>
            </div>
            {errorMsg && <div className="text-red-500 font-semibold mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{errorMsg}</div>}
            <Nav onBack={back} onNext={handleNext1} canNext={true} />
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-soft p-10 space-y-8">
            <div className="flex items-center gap-3 text-base font-semibold text-primary">
              <Activity className="h-5 w-5" /> Step 3 — Risk Appetite
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {(["low", "medium", "high"] as RiskAppetite[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={`rounded-xl border p-5 text-left transition-all ${
                    risk === r ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="font-sans text-lg font-semibold capitalize">{r} Risk</div>
                  <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {r === "low" ? "Bonds-heavy, capital preservation." : r === "medium" ? "Balanced equities and bonds." : "Aggressive growth equities."}
                  </div>
                </button>
              ))}
            </div>
            <Nav onBack={back} onNext={handleSubmit} canNext={true} nextLabel="Generate My Plan" />
          </div>
        )}
      </div>
    </div>
  );
};

const inputCls =
  "w-full rounded-xl border border-border bg-background px-5 py-4 font-mono text-base outline-none transition-all hover:border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <div className="mb-3 text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap truncate">{label}</div>
    {children}
  </label>
);

const Nav = ({
  onBack,
  onNext,
  canNext,
  nextLabel = "Continue →",
}: {
  onBack?: () => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel?: string;
}) => (
  <div className="mt-12 flex items-center justify-between">
    {onBack ? (
      <button onClick={onBack} className="rounded-xl border border-border bg-background px-6 py-3 text-base font-semibold transition-all hover:bg-secondary">
        Back
      </button>
    ) : (
      <span />
    )}
    <button
      onClick={onNext}
      disabled={!canNext}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      {nextLabel}
    </button>
  </div>
);
