import { motion } from "framer-motion";

interface Props {
  label: string;
  value: string;
  delta: number;
  spark?: number[];
}

export const StatCard = ({ label, value, delta, spark = [4, 6, 5, 8, 7, 9, 8] }: Props) => {
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const points = spark
    .map((v, i) => `${(i / (spark.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 25}`)
    .join(" ");
  const positive = delta >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card group relative overflow-hidden p-8 md:p-8 sm:p-6 min-h-[160px] flex flex-col justify-between transition-smooth hover:border-primary/40"
    >
      <div className="metric-label">{label}</div>
      <div className="mt-4 md:mt-6 flex items-baseline gap-3 md:gap-4">
        <div className="metric-number">{value}</div>
        <span className={positive ? "stat-pill-up" : "stat-pill-down"}>
          {positive ? "+" : ""}
          {delta}%
        </span>
      </div>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-6 md:mt-8 h-12 w-full flex-shrink-0">
        <defs>
          <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <polygon points={`0,30 ${points} 100,30`} fill={`url(#g-${label})`} />
      </svg>
    </motion.div>
  );
};
