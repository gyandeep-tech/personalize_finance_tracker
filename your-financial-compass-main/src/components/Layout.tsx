import { LayoutDashboard, PieChart, Brain, BarChart3, Target, Settings, Search, Bell, RotateCcw, ChevronLeft, ChevronRight, LogOut, AlertCircle } from "lucide-react";
import { useUserProfile } from "@/context/UserProfile";
import { useState } from "react";

export type Tab = "dashboard" | "spending" | "forecast" | "goals" | "settings";

const items: { id: Tab; icon: any; label: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "spending", icon: PieChart, label: "Spending" },
  { id: "forecast", icon: BarChart3, label: "Forecast" },
  { id: "goals", icon: Target, label: "Goals" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export const Sidebar = ({ 
  active, 
  onChange,
  isExpanded,
  onToggle
}: { 
  active: Tab; 
  onChange: (t: Tab) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const { reset } = useUserProfile();
  
  return (
    <aside 
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col items-start border-r border-border/60 bg-sidebar/80 py-6 backdrop-blur-xl transition-all duration-300 ${isExpanded ? "w-64" : "w-20"}`}
    >
      <div className={`mb-8 flex items-center px-4 w-full ${isExpanded ? "justify-start gap-3" : "justify-center"}`}>
        {isExpanded ? (
          <span className="font-display text-2xl font-bold tracking-widest text-primary cursor-pointer whitespace-nowrap pt-2" onClick={onToggle}>SmartSave</span>
        ) : (
          <div className="h-10 w-10 flex-shrink-0 cursor-pointer" onClick={onToggle} />
        )}
      </div>

      <div className="flex-1 w-full flex flex-col gap-2 px-3">
        {items.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            title={!isExpanded ? label : undefined}
            onClick={() => onChange(id)}
            className={`flex items-center gap-4 rounded-xl px-3 py-3 w-full transition-all ${
              active === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            } ${!isExpanded ? "justify-center" : "justify-start"}`}
            aria-label={label}
          >
            <Icon className="h-6 w-6 flex-shrink-0" />
            {isExpanded && <span className="font-semibold text-sm whitespace-nowrap">{label}</span>}
          </button>
        ))}
      </div>

      <div className="mt-auto px-3 w-full flex flex-col gap-2">
        <button
          onClick={onToggle}
          className={`flex items-center gap-4 rounded-xl px-3 py-3 w-full transition-all text-muted-foreground hover:bg-secondary/50 hover:text-foreground ${!isExpanded ? "justify-center" : "justify-start"}`}
        >
          {isExpanded ? <ChevronLeft className="h-6 w-6 flex-shrink-0" /> : <ChevronRight className="h-6 w-6 flex-shrink-0" />}
          {isExpanded && <span className="font-semibold text-sm whitespace-nowrap">Collapse</span>}
        </button>
        
        <button
          onClick={reset}
          className={`flex items-center gap-4 rounded-xl px-3 py-3 w-full transition-all text-red-500 hover:bg-red-500/10 ${!isExpanded ? "justify-center" : "justify-start"}`}
          title={!isExpanded ? "Logout" : undefined}
        >
          <LogOut className="h-6 w-6 flex-shrink-0" />
          {isExpanded && <span className="font-semibold text-sm whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export const TopBar = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const { profile } = useUserProfile();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);

  const initials = (profile?.name || "You")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const alerts: string[] = [];
  if (profile) {
    if (profile.expenses > profile.income) {
      alerts.push("Warning: Your monthly expenses currently exceed your income. Consider reviewing your budget to reduce your spending where possible.");
    }
    if (profile.goal.targetMonths > 120) {
      alerts.push(`Notice: Resolving "${profile.goal.name}" will span over 10 years at your current timeline. Consider strategies to accelerate your savings.`);
    }
  }

  const hasUnread = alerts.length > 0 && !hasSeenNotifications;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!hasSeenNotifications) {
      setHasSeenNotifications(true);
    }
  };
  return (
    <header className="mb-10 md:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 md:gap-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
        <p className="body-text text-muted-foreground mt-3">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-start sm:justify-end">
        <div className="relative">
          <button className="nav-icon relative" aria-label="Notifications" onClick={handleNotificationClick}>
            <Bell className="h-6 w-6" />
            {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-xl border border-border bg-background shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 overflow-hidden">
              <div className="bg-secondary/40 px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="p-4">
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert, i) => (
                      <div key={i} className="flex gap-3 text-sm p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-foreground leading-relaxed">
                        <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>{alert}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 text-center">You're all caught up!</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center rounded-full border border-border/60 bg-card/60 p-1.5 backdrop-blur-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 font-display text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};
