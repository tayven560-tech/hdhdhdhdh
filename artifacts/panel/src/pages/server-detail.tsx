import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { 
  useGetServer, 
  useGetServerLogs, 
  useGetServerMetrics,
  useStartServer,
  useStopServer,
  useRestartServer,
  useSendCommand,
  useDeleteServer,
  getGetServerQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Terminal, Play, Square, RotateCw, Trash2, Cpu, Activity, Server as ServerIcon, Users, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

function formatUptime(seconds?: number | null) {
  if (seconds == null) return "Offline";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function ServerDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cmd, setCmd] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: server, isLoading: isLoadingServer } = useGetServer(id, {
    query: { refetchInterval: 3000 }
  });
  
  const { data: logs } = useGetServerLogs(id, {
    query: { refetchInterval: 2000 }
  });
  
  const { data: metrics } = useGetServerMetrics(id, {
    query: { refetchInterval: 5000 }
  });

  const startServer = useStartServer({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetServerQueryKey(id) }) }});
  const stopServer = useStopServer({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetServerQueryKey(id) }) }});
  const restartServer = useRestartServer({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetServerQueryKey(id) }) }});
  const deleteServer = useDeleteServer();
  const sendCommand = useSendCommand();

  // Auto-scroll console
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim() || server?.status !== "running") return;
    sendCommand.mutate({ id, data: { command: cmd } });
    setCmd("");
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this server instance?")) {
      deleteServer.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Server deleted" });
          setLocation("/");
        }
      });
    }
  };

  if (isLoadingServer) {
    return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-6" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!server) {
    return <div className="p-8 text-destructive">Server not found.</div>;
  }

  const isWorking = startServer.isPending || stopServer.isPending || restartServer.isPending || server.status === "starting" || server.status === "stopping";
  const isRunning = server.status === "running";

  const chartData = metrics?.map(m => ({
    time: new Date(m.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    players: m.playerCount
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight font-mono">{server.name}</h1>
            <Badge variant="outline" className="uppercase font-mono">{server.software} {server.version}</Badge>
            <Badge variant="outline" className={
              server.status === "running" ? "border-green-500 text-green-500" :
              server.status === "stopped" ? "border-muted text-muted-foreground" :
              "border-yellow-500 text-yellow-500 animate-pulse"
            }>
              {server.status}
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-4 text-sm font-mono">
            <span className="flex items-center gap-1"><Wifi size={14} /> 0.0.0.0:{server.port}</span>
            <span className="flex items-center gap-1"><Cpu size={14} /> {server.memoryMb}MB</span>
            <span className="flex items-center gap-1"><ServerIcon size={14} /> {server.plan}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="bg-green-500/10 text-green-500 hover:bg-green-500/20" disabled={isWorking || isRunning} onClick={() => startServer.mutate({ id })}>
            <Play size={16} className="mr-2" /> Start
          </Button>
          <Button variant="secondary" size="sm" className="bg-red-500/10 text-red-500 hover:bg-red-500/20" disabled={isWorking || !isRunning} onClick={() => stopServer.mutate({ id })}>
            <Square size={16} className="mr-2" /> Stop
          </Button>
          <Button variant="secondary" size="sm" disabled={isWorking || !isRunning} onClick={() => restartServer.mutate({ id })}>
            <RotateCw size={16} className="mr-2" /> Restart
          </Button>
          <Button variant="destructive" size="sm" disabled={isRunning || deleteServer.isPending} onClick={handleDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Console */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 flex flex-col h-[500px]">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-secondary/30">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal size={16} className="text-primary" />
                Live Console
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col min-h-0 bg-[#0c0c0c]">
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs"
              >
                {!logs?.length && (
                  <div className="text-muted-foreground opacity-50 italic">No logs available. Start the server to view output.</div>
                )}
                {logs?.map((log) => {
                  const isWarn = log.line.includes("WARN");
                  const isErr = log.line.includes("ERROR");
                  const isInfo = log.line.includes("INFO");
                  
                  return (
                    <div key={log.id} className="break-all whitespace-pre-wrap">
                      <span className="text-muted-foreground/50 select-none mr-2">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                      </span>
                      <span className={
                        isErr ? "text-red-400" :
                        isWarn ? "text-yellow-400" :
                        isInfo ? "text-blue-300" :
                        "text-gray-300"
                      }>
                        {log.line}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="p-2 border-t border-border/50 bg-background/50">
                <form onSubmit={handleCommand} className="flex gap-2">
                  <span className="text-primary font-mono py-2 pl-2 select-none">{'>'}</span>
                  <Input 
                    value={cmd}
                    onChange={e => setCmd(e.target.value)}
                    placeholder={isRunning ? "Enter server command..." : "Server is offline"} 
                    className="font-mono bg-transparent border-0 focus-visible:ring-0 px-1 rounded-none"
                    disabled={!isRunning || sendCommand.isPending}
                  />
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="py-4 border-b border-border/50">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                Instance Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Players</div>
                <div className="text-2xl font-mono flex items-baseline gap-1">
                  {isRunning ? server.playerCount || 0 : 0}
                  <span className="text-sm text-muted-foreground">/ {server.maxPlayers}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Uptime</div>
                <div className="text-lg font-mono tracking-tight">{formatUptime(server.uptimeSeconds)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="py-4 border-b border-border/50">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Player Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={10}
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={10}
                      allowDecimals={false}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="players" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                  Not enough data collected
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}