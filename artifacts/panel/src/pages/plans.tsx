import { Link } from "wouter";
import { Check, Minus, Zap, Shield, Cpu, HeadphonesIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    tagline: "More than enough to get started. No card needed.",
    accent: "border-border hover:border-border/80",
    highlight: false,
    badge: null,
    features: [
      { label: "4 GB RAM", included: true },
      { label: "20 player slots", included: true },
      { label: "Paper (Java)", included: true },
      { label: "2 server instances", included: true },
      { label: "Shared CPU", included: true },
      { label: "Weekly world snapshots", included: true },
      { label: "Community support", included: true },
      { label: "Custom domain / SRV", included: false },
      { label: "DDoS protection", included: false },
      { label: "Daily automated backups", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Start for Free",
    ctaVariant: "outline" as const,
  },
  {
    id: "starter",
    name: "Starter",
    price: 3,
    period: "per month",
    tagline: "A solid jump up. Great for small friend groups.",
    accent: "border-border hover:border-primary/30",
    highlight: false,
    badge: "Best value",
    features: [
      { label: "8 GB RAM", included: true },
      { label: "40 player slots", included: true },
      { label: "Paper & Leaf", included: true },
      { label: "3 server instances", included: true },
      { label: "Boosted CPU priority", included: true },
      { label: "Weekly world snapshots", included: true },
      { label: "Email support (48h)", included: true },
      { label: "Custom domain / SRV", included: true },
      { label: "DDoS protection", included: false },
      { label: "Daily automated backups", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Get Starter — $3/mo",
    ctaVariant: "outline" as const,
  },
  {
    id: "pro",
    name: "Pro",
    price: 10,
    period: "per month",
    tagline: "Built for communities that take their server seriously.",
    accent: "border-primary shadow-[0_0_40px_rgba(124,58,237,0.2)]",
    highlight: true,
    badge: "Most Popular",
    features: [
      { label: "16 GB RAM", included: true },
      { label: "100 player slots", included: true },
      { label: "Paper, Leaf & Fabric", included: true },
      { label: "5 server instances", included: true },
      { label: "High-performance CPU", included: true },
      { label: "Daily automated backups", included: true },
      { label: "Priority support (12h)", included: true },
      { label: "Custom domain / SRV", included: true },
      { label: "DDoS protection", included: true },
      { label: "Mod & plugin installer", included: true },
      { label: "Dedicated support line", included: false },
    ],
    cta: "Get Pro — $10/mo",
    ctaVariant: "default" as const,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 25,
    period: "per month",
    tagline: "Maximum power. Dedicated resources. Full SLA.",
    accent: "border-border hover:border-border/80",
    highlight: false,
    badge: null,
    features: [
      { label: "32 GB RAM", included: true },
      { label: "Unlimited player slots", included: true },
      { label: "Paper, Leaf & Fabric", included: true },
      { label: "15 server instances", included: true },
      { label: "Dedicated CPU cores", included: true },
      { label: "Daily automated backups", included: true },
      { label: "Dedicated support (4h SLA)", included: true },
      { label: "Custom domain / SRV", included: true },
      { label: "DDoS protection", included: true },
      { label: "Mod & plugin installer", included: true },
      { label: "Dedicated support line", included: true },
    ],
    cta: "Get Enterprise — $25/mo",
    ctaVariant: "outline" as const,
  },
];

const highlights = [
  {
    icon: Zap,
    title: "Instant Provisioning",
    description: "Your server is live within seconds. No waiting, no tickets.",
  },
  {
    icon: Cpu,
    title: "NVMe SSD Storage",
    description: "Fast NVMe on every plan — worlds load faster, chunks generate smoother.",
  },
  {
    icon: Shield,
    title: "99.9% Uptime SLA",
    description: "Redundant infrastructure keeps your world online around the clock.",
  },
  {
    icon: HeadphonesIcon,
    title: "Real Human Support",
    description: "Our team knows Minecraft infrastructure. No bots, no canned responses.",
  },
];

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade or downgrade any time from your server settings. Changes apply immediately — no downtime.",
  },
  {
    q: "What Minecraft software is supported?",
    a: "Paper, Leaf, and Fabric across versions 1.19.4 through 1.21.4. More versions added regularly.",
  },
  {
    q: "What payment methods are accepted?",
    a: "All major credit and debit cards, plus PayPal. Billing is monthly — cancel any time, no penalties.",
  },
  {
    q: "Is the Free plan really free forever?",
    a: "Yes. No credit card required, no trial period, no expiry. Just the listed resource caps.",
  },
  {
    q: "Do higher plans get better performance?",
    a: "Yes. Starter and above get boosted CPU priority. Pro and Enterprise run on high-performance dedicated cores.",
  },
  {
    q: "What are world snapshots vs. daily backups?",
    a: "Snapshots are weekly point-in-time saves. Daily backups (Pro+) run automatically every 24h and are retained for 30 days.",
  },
];

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      {included ? (
        <Check size={14} className="text-primary shrink-0" />
      ) : (
        <Minus size={14} className="text-muted-foreground/30 shrink-0" />
      )}
      <span className={included ? "text-foreground" : "text-muted-foreground/40 line-through decoration-1"}>
        {label}
      </span>
    </li>
  );
}

export default function Plans() {
  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-20">

      {/* Header */}
      <div className="text-center space-y-4 pt-6">
        <Badge variant="outline" className="text-primary border-primary/30 mb-2 font-mono text-xs tracking-widest uppercase">
          Pricing
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight">
          Pick your plan.<br />
          <span className="text-primary">Scale when you're ready.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          All plans include NVMe storage, instant provisioning, and full panel access. No surprises.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {plans.map((plan) => (
          <div
            key={plan.id}
            data-testid={`plan-card-${plan.id}`}
            className={cn(
              "relative rounded-xl border-2 bg-card/60 backdrop-blur flex flex-col p-6 transition-all duration-200",
              plan.accent,
              plan.highlight && "scale-[1.02]"
            )}
          >
            {plan.badge && (
              <Badge
                className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap",
                  plan.highlight
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground border border-border"
                )}
              >
                {plan.highlight && <Star size={10} className="mr-1 inline" />}
                {plan.badge}
              </Badge>
            )}

            <div className="mb-5">
              <h2 className="text-lg font-bold mb-1">{plan.name}</h2>
              <p className="text-muted-foreground text-xs leading-relaxed mb-4">{plan.tagline}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono tracking-tight">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground text-xs">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1 mb-7">
              {plan.features.map((f) => (
                <FeatureRow key={f.label} label={f.label} included={f.included} />
              ))}
            </ul>

            <Button
              asChild
              variant={plan.ctaVariant}
              size="sm"
              className={cn(
                "w-full font-medium",
                plan.highlight && "shadow-[0_0_20px_rgba(124,58,237,0.5)]"
              )}
              data-testid={`plan-cta-${plan.id}`}
            >
              <Link href={`/servers/new?plan=${plan.id}`}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>

      {/* Social proof strip */}
      <div className="border border-border/40 rounded-xl bg-card/20 py-6 px-8 flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
        {[
          { value: "12,000+", label: "Servers hosted" },
          { value: "99.97%", label: "Avg. uptime last 90 days" },
          { value: "<30s", label: "Avg. provisioning time" },
          { value: "4 plans", label: "Grades to match your growth" },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="text-2xl font-bold font-mono text-primary">{stat.value}</div>
            <div className="text-muted-foreground text-sm mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Highlights */}
      <div>
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8 font-mono">
          On every plan, no exceptions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="rounded-lg border border-border/50 bg-card/40 p-5 space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <h.icon size={18} className="text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{h.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{h.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Frequently asked</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {faqs.map((item) => (
            <div key={item.q} className="space-y-1.5">
              <p className="font-semibold text-sm">{item.q}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center border border-primary/20 rounded-2xl bg-primary/5 py-12 px-6 space-y-4">
        <h2 className="text-2xl font-bold">Not sure which plan is right?</h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm">
          Start on Free. Upgrade the moment you need more room. It takes 10 seconds.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="default" size="lg" className="shadow-[0_0_20px_rgba(124,58,237,0.4)]" data-testid="cta-start-free">
            <Link href="/servers/new?plan=free">Start for Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" data-testid="cta-get-pro">
            <Link href="/servers/new?plan=pro">Get Pro</Link>
          </Button>
        </div>
      </div>

    </div>
  );
}
