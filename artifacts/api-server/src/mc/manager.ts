import { spawn, type ChildProcess } from "child_process";
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { logger } from "../lib/logger";
import type { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db, serverMetricsTable } from "@workspace/db";

const SERVERS_DIR = join(process.cwd(), "mc-servers");

interface ServerProcess {
  process: ChildProcess;
  logs: string[];
  startedAt: Date;
  playerCount: number;
  clients: Set<WebSocket>;
  metricsInterval: ReturnType<typeof setInterval>;
  name: string;
}

const running = new Map<number, ServerProcess>();

export const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  const match = req.url?.match(/\/api\/servers\/(\d+)\/ws/);
  if (!match) { ws.close(); return; }
  const id = parseInt(match[1], 10);

  const sp = running.get(id);
  if (sp) {
    sp.clients.add(ws);
    sp.logs.slice(-200).forEach(line => ws.send(line));
  } else {
    ws.send("[Server is not currently running]");
  }

  ws.on("close", () => running.get(id)?.clients.delete(ws));
});

function broadcast(id: number, line: string) {
  const sp = running.get(id);
  if (!sp) return;
  sp.logs.push(line);
  if (sp.logs.length > 500) sp.logs.shift();
  for (const client of sp.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(line);
  }
}

function recordMetrics(id: number) {
  const sp = running.get(id);
  if (!sp) return;
  const uptimeSeconds = Math.floor((Date.now() - sp.startedAt.getTime()) / 1000);
  db.insert(serverMetricsTable)
    .values({ serverId: id, playerCount: sp.playerCount, uptimeSeconds })
    .catch((err) => logger.error({ err, id }, "Failed to record metrics"));
}

async function downloadPaper(version: string, serverDir: string): Promise<string> {
  const jarPath = join(serverDir, `paper-${version}.jar`);
  if (existsSync(jarPath)) return jarPath;

  logger.info({ version }, "Fetching latest Paper build info");
  const buildRes = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}/builds`);
  if (!buildRes.ok) throw new Error(`Paper API error: ${buildRes.status}`);
  const buildData = (await buildRes.json()) as { builds: Array<{ build: number }> };
  const latestBuild = buildData.builds.at(-1)?.build;
  if (!latestBuild) throw new Error("No Paper builds found");

  const downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${latestBuild}/downloads/paper-${version}-${latestBuild}.jar`;
  logger.info({ downloadUrl }, "Downloading Paper JAR");

  const jarRes = await fetch(downloadUrl);
  if (!jarRes.ok) throw new Error(`Paper download error: ${jarRes.status}`);

  const dest = createWriteStream(jarPath);
  const reader = jarRes.body!.getReader();
  await new Promise<void>((resolve, reject) => {
    dest.on("error", reject);
    dest.on("finish", resolve);
    const pump = () =>
      reader.read().then(({ done, value }) => {
        if (done) { dest.end(); return; }
        dest.write(Buffer.from(value));
        pump();
      }).catch(reject);
    pump();
  });

  logger.info({ jarPath }, "Paper JAR downloaded");
  return jarPath;
}

async function downloadLeaf(version: string, serverDir: string): Promise<string> {
  const jarPath = join(serverDir, `leaf-${version}.jar`);
  if (existsSync(jarPath)) return jarPath;

  logger.info({ version }, "Fetching latest Leaf build info");

  const buildRes = await fetch(
    `https://api.leafmc.one/v2/projects/leaf/versions/${version}/builds`,
    { headers: { "Accept": "application/json" } }
  );

  if (!buildRes.ok) {
    logger.warn({ version, status: buildRes.status }, "Leaf API failed, trying GitHub releases");
    return downloadLeafFromGitHub(version, serverDir, jarPath);
  }

  const buildData = (await buildRes.json()) as {
    builds: Array<{ build: number; downloads?: { application?: { name: string } } }>;
  };
  const latest = buildData.builds.at(-1);
  if (!latest) throw new Error("No Leaf builds found");

  const jarName = latest.downloads?.application?.name ?? `leaf-${version}-${latest.build}.jar`;
  const downloadUrl = `https://api.leafmc.one/v2/projects/leaf/versions/${version}/builds/${latest.build}/downloads/${jarName}`;
  logger.info({ downloadUrl }, "Downloading Leaf JAR");

  const jarRes = await fetch(downloadUrl);
  if (!jarRes.ok) throw new Error(`Leaf download error: ${jarRes.status}`);

  const dest = createWriteStream(jarPath);
  const reader = jarRes.body!.getReader();
  await new Promise<void>((resolve, reject) => {
    dest.on("error", reject);
    dest.on("finish", resolve);
    const pump = () =>
      reader.read().then(({ done, value }) => {
        if (done) { dest.end(); return; }
        dest.write(Buffer.from(value));
        pump();
      }).catch(reject);
    pump();
  });

  logger.info({ jarPath }, "Leaf JAR downloaded");
  return jarPath;
}

async function downloadFabric(version: string, serverDir: string): Promise<string> {
  const jarPath = join(serverDir, `fabric-${version}.jar`);
  if (existsSync(jarPath)) return jarPath;

  logger.info({ version }, "Fetching Fabric loader and installer versions");

  const [loaderRes, installerRes] = await Promise.all([
    fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}`, {
      headers: { Accept: "application/json" },
    }),
    fetch("https://meta.fabricmc.net/v2/versions/installer", {
      headers: { Accept: "application/json" },
    }),
  ]);

  if (!loaderRes.ok) throw new Error(`Fabric loader API error: ${loaderRes.status}`);
  if (!installerRes.ok) throw new Error(`Fabric installer API error: ${installerRes.status}`);

  const loaderData = (await loaderRes.json()) as Array<{ loader: { version: string } }>;
  const installerData = (await installerRes.json()) as Array<{ version: string; stable: boolean }>;

  const latestLoader = loaderData[0]?.loader?.version;
  const stableInstaller = installerData.find((i) => i.stable)?.version ?? installerData[0]?.version;

  if (!latestLoader) throw new Error("No Fabric loader found");
  if (!stableInstaller) throw new Error("No Fabric installer found");

  const downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${latestLoader}/${stableInstaller}/server/jar`;
  logger.info({ downloadUrl, latestLoader, stableInstaller }, "Downloading Fabric server JAR");

  const jarRes = await fetch(downloadUrl);
  if (!jarRes.ok) throw new Error(`Fabric download error: ${jarRes.status}`);

  const dest = createWriteStream(jarPath);
  const reader = jarRes.body!.getReader();
  await new Promise<void>((resolve, reject) => {
    dest.on("error", reject);
    dest.on("finish", resolve);
    const pump = () =>
      reader.read().then(({ done, value }) => {
        if (done) { dest.end(); return; }
        dest.write(Buffer.from(value));
        pump();
      }).catch(reject);
    pump();
  });

  logger.info({ jarPath }, "Fabric JAR downloaded");
  return jarPath;
}

async function downloadLeafFromGitHub(version: string, serverDir: string, jarPath: string): Promise<string> {
  const relRes = await fetch("https://api.github.com/repos/Winds-Studio/Leaf/releases/latest", {
    headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "VortexHosting/1.0" },
  });
  if (!relRes.ok) throw new Error(`GitHub API error: ${relRes.status}`);
  const release = (await relRes.json()) as { assets: Array<{ name: string; browser_download_url: string }> };

  const asset = release.assets.find((a) => a.name.endsWith(".jar"));
  if (!asset) throw new Error("No JAR found in Leaf GitHub release");

  logger.info({ url: asset.browser_download_url }, "Downloading Leaf JAR from GitHub");
  const jarRes = await fetch(asset.browser_download_url);
  if (!jarRes.ok) throw new Error(`Leaf GitHub download error: ${jarRes.status}`);

  const dest = createWriteStream(jarPath);
  const reader = jarRes.body!.getReader();
  await new Promise<void>((resolve, reject) => {
    dest.on("error", reject);
    dest.on("finish", resolve);
    const pump = () =>
      reader.read().then(({ done, value }) => {
        if (done) { dest.end(); return; }
        dest.write(Buffer.from(value));
        pump();
      }).catch(reject);
    pump();
  });

  logger.info({ jarPath }, "Leaf JAR downloaded from GitHub");
  return jarPath;
}

async function downloadJar(software: string, version: string, serverDir: string): Promise<string> {
  if (software === "leaf") return downloadLeaf(version, serverDir);
  if (software === "fabric") return downloadFabric(version, serverDir);
  return downloadPaper(version, serverDir);
}

export async function prepareServer(id: number, software: string, version: string): Promise<void> {
  const dir = join(SERVERS_DIR, String(id));
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, "plugins"), { recursive: true });
  await downloadJar(software, version, dir);
  writeFileSync(join(dir, "eula.txt"), "eula=true\n", { flag: "w" });
}

export async function startServer(
  id: number,
  name: string,
  software: string,
  version: string,
  memoryMb: number,
  port: number,
): Promise<void> {
  if (running.has(id)) throw new Error("Already running");

  const dir = join(SERVERS_DIR, String(id));
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, "plugins"), { recursive: true });
  const jarPath = await downloadJar(software, version, dir);
  writeFileSync(join(dir, "eula.txt"), "eula=true\n", { flag: "w" });

  const serverProperties = [
    `server-port=${port}`,
    `max-players=20`,
    `online-mode=false`,
    `enable-query=false`,
    `enable-rcon=false`,
  ].join("\n");
  writeFileSync(join(dir, "server.properties"), serverProperties, { flag: "w" });

  const javaArgs = [
    `-Xms${Math.floor(memoryMb / 2)}M`,
    `-Xmx${memoryMb}M`,
    "-jar",
    jarPath,
    "--nogui",
  ];

  const proc = spawn("java", javaArgs, { cwd: dir, stdio: ["pipe", "pipe", "pipe"] });
  const metricsInterval = setInterval(() => recordMetrics(id), 60_000);

  const sp: ServerProcess = {
    process: proc,
    logs: [],
    startedAt: new Date(),
    playerCount: 0,
    clients: new Set(),
    metricsInterval,
    name,
  };
  running.set(id, sp);

  const handleLine = (line: string) => {
    broadcast(id, line);
    if (line.match(/(\w+) joined the game/)) sp.playerCount = Math.max(0, sp.playerCount + 1);
    if (line.match(/(\w+) left the game/)) sp.playerCount = Math.max(0, sp.playerCount - 1);
  };

  let stdoutBuf = "";
  proc.stdout!.on("data", (chunk: Buffer) => {
    stdoutBuf += chunk.toString();
    const lines = stdoutBuf.split("\n");
    stdoutBuf = lines.pop()!;
    lines.forEach(handleLine);
  });

  let stderrBuf = "";
  proc.stderr!.on("data", (chunk: Buffer) => {
    stderrBuf += chunk.toString();
    const lines = stderrBuf.split("\n");
    stderrBuf = lines.pop()!;
    lines.forEach(handleLine);
  });

  proc.on("exit", (code) => {
    logger.info({ id, code }, "Server process exited");
    clearInterval(running.get(id)?.metricsInterval);
    running.delete(id);
  });

  proc.on("error", (err) => {
    logger.error({ id, err }, "Server process error");
    clearInterval(running.get(id)?.metricsInterval);
    running.delete(id);
  });

  logger.info({ id, port, memoryMb, software }, "Started Minecraft server");
}

export function stopServer(id: number): void {
  const sp = running.get(id);
  if (!sp) return;
  clearInterval(sp.metricsInterval);
  sp.process.stdin?.write("stop\n");
  setTimeout(() => {
    if (running.has(id)) {
      running.get(id)?.process.kill("SIGKILL");
      running.delete(id);
    }
  }, 10000);
}

export function sendCommand(id: number, command: string): boolean {
  const sp = running.get(id);
  if (!sp) return false;
  sp.process.stdin?.write(`${command}\n`);
  return true;
}

export function getLogs(id: number): string[] {
  return running.get(id)?.logs.slice(-200) ?? [];
}

export function isRunning(id: number): boolean {
  return running.has(id);
}

export function getPlayerCount(id: number): number {
  return running.get(id)?.playerCount ?? 0;
}

export function getUptimeSeconds(id: number): number | null {
  const sp = running.get(id);
  if (!sp) return null;
  return Math.floor((Date.now() - sp.startedAt.getTime()) / 1000);
}

export function getServerDir(id: number): string {
  return join(SERVERS_DIR, String(id));
}
