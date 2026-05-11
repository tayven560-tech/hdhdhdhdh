import { Link } from "wouter";
import { Check, Minus, Zap, Shield, Cpu, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    tagline: "Spin up your first node, zero commitment.",
    accent: "border-border",
    badge: null,
    features: [
      { label: "2 GB RAM", included: true },
      { label: "10 player slots", included: true },
      { label: "Paper (Java) only", included: true },
      { label: "1 server instance", included: true },
      { label: "Shared CPU", included: true },
      { label: "Community support", included: true },
      { label: "Custom domain / SRV", included: false },
      { label: "DDoS protection", included: false },
      { label: "Automated backups", included: false },
      { label: "Priority queue", included: false },
    ],
    cta: "Get Started",
    ctaVariant: "outline" as const,
  },
  {
    id: "premium",
    name: "Premium",
    price: 5,
    period: "per month",
    tagline: "For servers that need room to grow.",
    accent: "border-primary shadow-[0_0_30px_rgba(124,58,237,0.25)]",
    badge: "Most Popular",
    features: [
      { label: "8 GB RAM", included: true },
      { label: "50 player slots", included: true },
      { label: "Paper, Leaf & Fabric", included: true },
      { label: "3 server instances", included: true },
      { label: "Boosted CPU allocation", included: true },
      { label: "Priority support (24h)", included: true },
      { label: "Custom domain / SRV", included: true },
      { label: "DDoS protection", included: false },
      { label: "Automated backups", included: false },
      { label: "Priority queue", included: false },
    ],
    cta: "Subscribe — $5/mo",
    ctaVariant: "default" as const,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 15,
    period: "per month",
    tagline: "Maximum performance. No compromises.",
    accent: "border-border",
    badge: null,
    features: [
      { label: "16 GB RAM", included: true },
      { label: "Unlimited player slots", included: true },
      { label: "Paper, Leaf & Fabric", included: true },
      { label: "10 server instances", included: true },
      { label: "Dedicated CPU cores", included: true },
      { label: "Dedicated support (4h SLA)", included: true },
      { label: "Custom domain / SRV", included: true },
      { label: "DDoS protection", included: true },
      { label: "Automated daily backups", included: true },
      { label: "Priority queue", included: true },
    ],
    cta: "Subscribe — $15/mo",
    ctaVariant: "outline" as const,
  },
];

const highlights = [
  {
    icon: Zap,
    title: "Instant Provisioning",
    description: "Your server is live within seconds of deployment. No waiting, no tickets.",
  },
  {
    icon: Cpu,
    title: "NVMe SSD Storage",
    description: "All plans run on NVMe storage for fast world loading and chunk generation.",
  },
  {
    icon: Shield,
    title: "99.9% Uptime SLA",
    description: "Redundant infrastructure ensures your world stays online around the clock.",
  },
  {
    icon: HeadphonesIcon,
    title: "Real Human Support",
    description: "No bots, no canned responses. Our team knows Minecraft infrastructure deeply.",
  },
];

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      {included ? (
        <Check size={15} className="text-primary shrink-0" />
      ) : (
        <Minus size={15} className="text-muted-foreground/40 shrink-0" />
      )}
      <span className={included ? "text-foreground" : "text-muted-foreground/50"}>
        {label}
      </span>
    </li>
  );
}

export default function Plans() {
  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-4xl font-bold tracking-tight">Simple, honest pricing</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Pick the plan that fits your server. Upgrade or downgrade any time — no lock-in.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.id}
            data-testid={`plan-card-${plan.id}`}
            className={cn(
              "relative rounded-xl border-2 bg-card/60 backdrop-blur flex flex-col p-6 transition-all",
              plan.accent
            )}
          >
            {plan.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                {plan.badge}
              </Badge>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <p className="text-muted-foreground text-sm mb-4">{plan.tagline}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {plan.features.map((f) => (
                <FeatureRow key={f.label} label={f.label} included={f.included} />
              ))}
            </ul>

            <Button
              asChild
              variant={plan.ctaVariant}
              className={cn("w-full", plan.id === "premium" && "shadow-[0_0_20px_rgba(124,58,237,0.4)]")}
              data-testid={`plan-cta-${plan.id}`}
            >
              <Link href={`/servers/new?plan=${plan.id}`}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>

      {/* Highlights grid */}
      <div>
        <h2 className="text-xl font-semibold text-center mb-8 text-muted-foreground uppercase tracking-widest text-sm">
          Everything included, on every plan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="rounded-lg border border-border/50 bg-card/40 p-5 space-y-3"
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

      {/* FAQ-style comparison note */}
      <div className="border border-border/50 rounded-xl bg-card/30 p-8 space-y-4 text-sm text-muted-foreground">
        <h3 className="text-foreground font-semibold text-base mb-2">Frequently asked</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-foreground font-medium mb-1">Can I switch plans later?</p>
            <p>Yes. Upgrade or downgrade at any time from your server settings. Changes apply immediately.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">What software versions are supported?</p>
            <p>We support Paper, Leaf, and Fabric across Minecraft 1.19.4 through 1.21.4. More versions added regularly.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">What payment methods are accepted?</p>
            <p>All major credit and debit cards, as well as PayPal. Billing is monthly, cancel anytime.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">Is the Free plan really free forever?</p>
            <p>Yes — no credit card required. The Free plan has no time limit, just the listed resource caps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
