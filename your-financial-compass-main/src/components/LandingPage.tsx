import { Wallet, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";

export const LandingPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between overflow-hidden">
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 py-8 flex justify-center z-10">
        <h1 className="font-display font-medium text-2xl tracking-widest text-foreground">
          SmartSave
        </h1>
      </header>

      {/* Main Hero & Split Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 pt-20 pb-8 flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-10">
          
          {/* Left: Copy & CTA */}
          <div className="space-y-6">
            <h2 className="font-display font-bold text-5xl tracking-tight text-foreground sm:text-6xl leading-[1.05]">
              MASTER YOUR<br />FINANCES. UNLOCK<br />YOUR FUTURE.
            </h2>
            <p className="text-muted-foreground text-xl max-w-xl leading-relaxed">
              Optimize savings, invest intelligently, and make data-driven decisions with AI-powered personalized insights.
            </p>
            <div className="pt-2">
              <button 
                onClick={onStart}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-8 py-4 text-sm font-bold tracking-wider uppercase text-foreground transition-all hover:bg-secondary/80 shadow-sm"
              >
                Start Your Journey
              </button>
            </div>
          </div>

          {/* Right: Minimal Abstract Illustration */}
          <div className="relative hidden lg:flex justify-end items-center aspect-square max-h-[400px]">
            {/* Abstract geometric composition evoking finance/tech in a human-crafted way */}
            <div className="relative w-[320px] h-[320px]">
              {/* Soft background glow */}
              <div className="absolute inset-0 bg-orange-100/40 rounded-full blur-3xl opacity-60"></div>
              
              {/* Geometric elements */}
              <div className="absolute top-4 right-4 w-40 h-56 bg-card border border-border rounded-2xl shadow-soft transform rotate-3"></div>
              <div className="absolute top-16 left-8 w-56 h-48 bg-background border border-border rounded-2xl shadow-soft transform -rotate-6 flex flex-col p-6 justify-between overflow-hidden">
                <div className="w-12 h-2 bg-muted/60 rounded-full"></div>
                <div className="space-y-3">
                  <div className="w-full h-12 bg-primary/5 rounded-lg flex items-end p-2 gap-1">
                    <div className="w-1/4 bg-primary/20 h-1/3 rounded-sm"></div>
                    <div className="w-1/4 bg-primary/30 h-2/3 rounded-sm"></div>
                    <div className="w-1/4 bg-primary/50 h-1/2 rounded-sm"></div>
                    <div className="w-1/4 bg-primary/80 h-full rounded-sm"></div>
                  </div>
                </div>
              </div>

              {/* Foreground overlapping element */}
              <div className="absolute bottom-8 right-12 w-32 h-32 bg-orange-50 border border-border rounded-full shadow-md flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Wallet className="h-6 w-6" />}
            title="SMART BUDGETING"
            description="Analyze habits, set goals, save effortlessly."
          />
          <FeatureCard 
            icon={<TrendingUp className="h-6 w-6" />}
            title="INTELLIGENT INVESTING"
            description="Personalized portfolios, market trends, optimize growth."
          />
          <FeatureCard 
            icon={<ShieldCheck className="h-6 w-6" />}
            title="FINANCIAL WELLNESS"
            description="Track goals, reduce debt, secure retirement."
          />
        </div>
      </main>
      
      {/* Bottom Right Decoration (Sparkle from reference image layout) */}
      <div className="absolute bottom-8 right-8 text-border/80 group-hover:text-border transition-colors">
        <Sparkles className="w-10 h-10" strokeWidth={1} />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 rounded-3xl border border-border bg-card shadow-soft hover:shadow-md transition-all group flex flex-col h-full">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 transition-transform group-hover:scale-105 group-hover:bg-orange-200">
        {icon}
      </div>
      <div className="flex-1 mt-1">
        <h3 className="font-bold text-base tracking-wide uppercase leading-tight mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);
