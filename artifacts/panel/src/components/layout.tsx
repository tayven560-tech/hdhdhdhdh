import * as React from "react";
import { Link, useLocation } from "wouter";
import { Server, Activity, Plus, CreditCard, LogOut, Crown } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const OWNER_EMAIL = "thethe231hgf@outlook.com";

export function useIsOwner() {
  const { user } = useUser();
  return user?.primaryEmailAddress?.emailAddress === OWNER_EMAIL;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const isOwner = useIsOwner();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row dark">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            <Server size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">Vortex Hosting</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard" className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", location === "/dashboard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
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

        {/* User section */}
        <div className="p-4 border-t border-border space-y-2">
          {isLoaded && user && (
            <div className="flex items-start gap-3 px-3 py-2 rounded-md bg-secondary/30">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                {user.firstName?.[0] ?? user.primaryEmailAddress?.emailAddress[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">
                    {user.firstName ?? user.primaryEmailAddress?.emailAddress.split("@")[0]}
                  </span>
                  {isOwner && (
                    <Crown size={11} className="text-yellow-500 shrink-0" title="Owner" />
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {isOwner ? "Owner · All plans free" : user.primaryEmailAddress?.emailAddress}
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 text-xs"
            onClick={() => signOut({ redirectUrl: "/" })}
            data-testid="button-sign-out"
          >
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
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
