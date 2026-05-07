import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useUserProfile, deriveFinance } from "@/context/UserProfile";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 16,
  color: "hsl(var(--foreground))",
  fontSize: 14,
  padding: "12px 16px",
};

export const IncomeExpenseChart = () => {
  const { profile } = useUserProfile();
  if (!profile) return null;
  const { monthly } = deriveFinance(profile);
  return (
    <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px]">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="card-title">Income vs Expenditure</h3>
        <span className="rounded-full bg-secondary/60 px-4 py-2 text-sm text-muted-foreground whitespace-nowrap">Last 6 Months</span>
      </div>
      <div className="h-[300px] md:h-[340px] w-full">
        <ResponsiveContainer>
          <BarChart data={monthly} barGap={8}>
            <defs>
              <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={14} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--secondary) / 0.4)" }} />
            <Legend wrapperStyle={{ fontSize: 14, color: "hsl(var(--muted-foreground))", paddingTop: "20px" }} />
            <Bar dataKey="income" fill="url(#incomeBar)" radius={[12, 12, 0, 0]} />
            <Bar dataKey="expenses" fill="url(#expenseBar)" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const SpendingPie = () => {
  const { profile } = useUserProfile();
  if (!profile) return null;
  const { spendingBreakdown } = deriveFinance(profile);
  return (
    <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px]">
      <div className="mb-6 metric-label">Spending by Category</div>
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
        <div className="h-[240px] md:h-[260px] w-[240px] md:w-[260px] flex-shrink-0">
          <ResponsiveContainer>
            <BarChart layout="vertical" data={spendingBreakdown}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: "hsl(var(--muted-foreground))"}} />
              <Tooltip 
                contentStyle={{ ...tooltipStyle, background: "#374151", color: "#ffffff", border: "1px solid #4b5563" }} 
                itemStyle={{ color: "#ffffff" }}
                formatter={(v: number) => `₹${v}`} 
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {spendingBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-4 md:space-y-5 w-full md:w-auto">
          {spendingBreakdown.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="body-text text-muted-foreground">{c.name}</span>
              </span>
              <span className="font-mono font-semibold text-base md:text-lg whitespace-nowrap">₹{c.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const ForecastChart = () => {
  const { profile } = useUserProfile();
  if (!profile) return null;
  const { forecast } = deriveFinance(profile);
  return (
    <div className="glass-card p-8 md:p-8 sm:p-6 min-h-[160px]">
      <div className="mb-6 md:mb-8 flex items-center gap-3">
        <span className="text-2xl">📅</span>
        <h3 className="card-title">6-Month Forecast</h3>
      </div>
      <div className="h-[320px] md:h-[380px] w-full">
        <ResponsiveContainer>
          <LineChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={14} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={14} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `₹${v.toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: 14, paddingTop: "24px" }} />
            <Line type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--accent))" }} />
            <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--primary))" }} />
            <Line type="monotone" dataKey="savings" stroke="hsl(var(--success))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--success))" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
