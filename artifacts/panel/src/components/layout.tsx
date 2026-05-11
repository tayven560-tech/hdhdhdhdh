import * as React from "react";
import { Link, useLocation } from "wouter";
import { Server, Activity, Plus, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row dark">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            <Server size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight uppercase">Vortex Ops</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/" className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", location === "/" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
            <Activity size={16} />
            Dashboard
          </Link>
          <Link href="/servers/new" className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", location === "/servers/new" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
            <Plus size={16} />
            Deploy Server
          </Link>
          <Link href="/plans" className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", location === "/plans" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
            <CreditCard size={16} />
            Plans & Pricing
          </Link>
        </nav>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}