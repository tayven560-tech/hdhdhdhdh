import { Link } from "wouter";
import { Server, Zap, Shield, Terminal, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Live in seconds",
    description: "Pick your plan, name your server, and it's provisioned instantly. No waiting, no tickets.",
  },
  {
    icon: Terminal,
    title: "Full console access",
    description: "Live log streaming and command input directly from your browser. Real-time, always.",
  },
  {
    icon: Shield,
    title: "99.9% uptime",
    description: "Redundant infrastructure keeps your world online. DDoS protection on Pro and above.",
  },
  {
    icon: Server,
    title: "All major software",
    description: "Paper, Leaf, and Fabric. Versions 1.19.4 through 1.21.4. More added regularly.",
  },
];

const planHighlights = [
  { name: "Free", price: "$0", feature: "4 GB RAM · 20 players" },
  { name: "Starter", price: "$3/mo", feature: "8 GB RAM · 40 players" },
  { name: "Pro", price: "$10/mo", feature: "16 GB RAM · 100 players", popular: true },
  { name: "Enterprise", price: "$25/mo", feature: "32 GB RAM · Unlimited" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground dark flex flex-col">
      {/* Nav */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            <Server size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Vortex Hosting</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-4xl mx-auto w-full space-y-8">
        <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 rounded-full px-4 py-1.5 text-sm text-primary font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Instant provisioning · No card required to start
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
          Host your Minecraft server.<br />
          <span className="text-primary">No fuss.</span>
        </h1>

        <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
          Vortex Hosting gives you a full Minecraft server — provisioned in seconds, managed from a clean panel, with live console access and automatic backups.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Button asChild size="lg" className="text-base px-8 shadow-[0_0_30px_rgba(124,58,237,0.4)]" data-testid="hero-cta-signup">
            <Link href="/sign-up">
              Start for Free <ChevronRight size={18} className="ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8" data-testid="hero-cta-plans">
            <Link href="/plans">View Plans</Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          Free plan: 4 GB RAM, 20 players, 2 servers — <span className="text-foreground">no credit card required</span>
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need, nothing you don't</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border/50 bg-card/40 p-6 space-y-3 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans strip */}
      <section className="border-t border-border/40 py-20 px-6 bg-card/10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">Pick a plan. Scale when you're ready.</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {planHighlights.map((p) => (
              <div key={p.name} className={`rounded-xl border p-5 text-left space-y-2 relative ${p.popular ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(124,58,237,0.15)]" : "border-border/50 bg-card/40"}`}>
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-2xl font-bold font-mono">{p.price}</div>
                <div className="text-muted-foreground text-xs">{p.feature}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
            {["Cancel anytime", "Upgrade in seconds", "No lock-in"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check size={13} className="text-primary" /> {item}
              </span>
            ))}
          </div>
          <Button asChild variant="outline" size="lg" data-testid="plans-cta">
            <Link href="/plans">Compare all plans</Link>
          </Button>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border/40 py-16 px-6 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Ready to launch your server?</h2>
          <p className="text-muted-foreground">Create your account in 30 seconds. Your server will be live before you finish your coffee.</p>
          <Button asChild size="lg" className="shadow-[0_0_20px_rgba(124,58,237,0.4)]" data-testid="footer-cta-signup">
            <Link href="/sign-up">Create Free Account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/30 py-6 px-6 text-center text-muted-foreground text-xs">
        © {new Date().getFullYear()} Vortex Hosting. All rights reserved.
      </footer>
    </div>
  );
}
