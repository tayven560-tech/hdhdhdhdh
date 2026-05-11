import { Link } from "wouter";
import { 
  useListServers, 
  useStartServer, 
  useStopServer, 
  useRestartServer, 
  getListServersQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Server as ServerType } from "@workspace/api-client-react";
import { Play, Square, RotateCw, ServerIcon, Clock, Users, Cpu, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatUptime(seconds?: number | null) {
  if (seconds == null) return "Offline";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function StatusBadge({ status }: { status: ServerType["status"] }) {
  switch (status) {
    case "running":
      return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Running</Badge>;
    case "stopped":
      return <Badge variant="secondary" className="text-muted-foreground">Stopped</Badge>;
    case "starting":
      return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20 animate-pulse">Starting</Badge>;
    case "stopping":
      return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 animate-pulse">Stopping</Badge>;
  }
}

function ServerCard({ server }: { server: ServerType }) {
  const queryClient = useQueryClient();
  
  const startServer = useStartServer({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListServersQueryKey() })
    }
  });
  
  const stopServer = useStopServer({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListServersQueryKey() })
    }
  });
  
  const restartServer = useRestartServer({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListServersQueryKey() })
    }
  });

  const isWorking = startServer.isPending || stopServer.isPending || restartServer.isPending || server.status === "starting" || server.status === "stopping";

  return (
    <Card className="flex flex-col border-border/50 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Link href={`/servers/${server.id}`} className="hover:text-primary transition-colors">{server.name}</Link>
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 uppercase tracking-wider font-mono">
              <span className="text-primary">{server.software}</span>
              <span>•</span>
              <span>{server.version}</span>
            </div>
          </div>
          <StatusBadge status={server.status} />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users size={14} className="text-primary/70" />
            <span>{server.status === "running" ? `${server.playerCount || 0}/${server.maxPlayers}` : "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock size={14} className="text-primary/70" />
            <span className="font-mono text-xs">{formatUptime(server.uptimeSeconds)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Cpu size={14} className="text-primary/70" />
            <span>{server.memoryMb} MB</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ServerIcon size={14} className="text-primary/70" />
            <span className="font-mono text-xs capitalize">{server.plan}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 border-t border-border/50 flex gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1 bg-green-500/10 text-green-500 hover:bg-green-500/20"
          disabled={isWorking || server.status === "running"}
          onClick={() => startServer.mutate({ id: server.id })}
        >
          <Play size={14} className="mr-1" /> Start
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/20"
          disabled={isWorking || server.status === "stopped"}
          onClick={() => stopServer.mutate({ id: server.id })}
        >
          <Square size={14} className="mr-1" /> Stop
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1"
          disabled={isWorking || server.status === "stopped"}
          onClick={() => restartServer.mutate({ id: server.id })}
        >
          <RotateCw size={14} className="mr-1" /> Restart
        </Button>
        <Button asChild variant="default" size="sm" className="ml-auto">
          <Link href={`/servers/${server.id}`}>Manage</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Dashboard() {
  const { data: servers, isLoading, isError } = useListServers({
    query: { refetchInterval: 3000 }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Servers</h1>
          <p className="text-muted-foreground">Monitor and control your server fleet.</p>
        </div>
        <Button asChild>
          <Link href="/servers/new">Deploy New Server</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-48 border-border/50">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-4 w-1/3 mb-8" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-lg flex flex-col items-center justify-center text-center">
          <AlertCircle className="text-destructive mb-2" size={32} />
          <h3 className="text-lg font-medium">System Failure</h3>
          <p className="text-muted-foreground">Unable to communicate with the master control server.</p>
        </div>
      ) : !servers || servers.length === 0 ? (
        <div className="p-12 border border-border/50 border-dashed rounded-lg flex flex-col items-center justify-center text-center">
          <ServerIcon className="text-muted-foreground mb-4 opacity-50" size={48} />
          <h3 className="text-xl font-medium mb-1">No Active Servers</h3>
          <p className="text-muted-foreground mb-6">Your fleet is empty. Deploy a new server to get started.</p>
          <Button asChild>
            <Link href="/servers/new">Deploy First Server</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map(server => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  );
}