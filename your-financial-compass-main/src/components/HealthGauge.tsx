import { motion } from "framer-motion";

export const HealthGauge = ({ score = 82 }: { score?: number }) => {
  const radius = 90;
  const circ = Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / 100));
  const offset = circ * (1 - pct);
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work";

  return (
    <div className="glass-card flex flex-col items-center justify-center gap-4 p-8 md:p-8 sm:p-6 h-full min-h-[160px]">
      <div className="metric-label">Financial Health Score</div>
      <div className="relative mx-auto h-[160px] md:h-[180px] w-[240px] md:w-[280px]">
        <svg viewBox="0 0 240 140" className="h-full w-full">
          <defs>
            <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
            </linearGradient>
          </defs>
          <path d="M 30 120 A 90 90 0 0 1 210 120" fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" strokeLinecap="round" />
          <motion.path
            key={score}
            d="M 30 120 A 90 90 0 0 1 210 120"
            fill="none"
            stroke="url(#gauge)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          <motion.div
            key={`v-${score}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="metric-number"
          >
            {score}
          </motion.div>
          <div className="mt-2 text-base md:text-lg font-semibold text-primary">{label}</div>
        </div>
      </div>
      <div className="body-text text-center text-muted-foreground">Based on your income, expenses & goal pace</div>
    </div>
  );
};
