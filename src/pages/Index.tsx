import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Ticket, BarChart3, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  {
    icon: Ticket,
    title: "Smart Ticketing",
    description: "Categorize, prioritize, and route tickets automatically based on issue type and severity.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Monitor SLA compliance, resolution times, and team performance at a glance.",
  },
  {
    icon: Clock,
    title: "SLA Tracking",
    description: "Set custom SLAs per client tier and get alerts before deadlines are breached.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-surface">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight">FinDesk</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground mb-6 animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            Built for financial services teams
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight mb-6 animate-fade-up">
            Resolve support tickets{" "}
            <span className="text-gradient">with precision</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            FinDesk is the enterprise ticketing platform designed for compliance-driven teams. Track issues, meet SLAs, and deliver exceptional support.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>FinDesk</span>
          </div>
          <p>&copy; {new Date().getFullYear()} FinDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
