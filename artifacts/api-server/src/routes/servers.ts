import { Router } from "express";
import { db, serversTable, serverMetricsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import * as mc from "../mc/manager";
import {
  notifyServerCreated,
  notifyServerStarted,
  notifyServerStopped,
  notifyServerDeleted,
} from "../lib/discord";
import { z } from "zod";
import multer from "multer";
import {
  readdirSync,
  statSync,
  unlinkSync,
  rmdirSync,
  mkdirSync,
  existsSync,
  createWriteStream,
} from "fs";
import { join, resolve, relative } from "path";

const router = Router();

const PLAN_MEMORY: Record<string, number> = {
  free: 4096,
  starter: 8192,
  pro: 16384,
  enterprise: 32768,
};

const PLAN_MAX_PLAYERS: Record<string, number> = {
  free: 20,
  starter: 40,
  pro: 100,
  enterprise: 500,
};

const CreateServerBody = z.object({
  name: z.string().min(1).max(64),
  software: z.enum(["paper", "leaf", "fabric"]).default("paper"),
  version: z.enum(["1.21.4", "1.20.4", "1.20.1", "1.19.4"]),
  plan: z.enum(["free", "starter", "pro", "enterprise"]),
  maxPlayers: z.number().int().optional(),
});

const CommandBody = z.object({ command: z.string() });

function toDto(row: typeof serversTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    software: row.software,
    version: row.version,
    plan: row.plan,
    port: row.port,
    status: mc.isRunning(row.id) ? "running" : (row.status as string),
    memoryMb: row.memoryMb,
    maxPlayers: row.maxPlayers,
    playerCount: mc.getPlayerCount(row.id),
    uptimeSeconds: mc.getUptimeSeconds(row.id),
    createdAt: row.createdAt.toISOString(),
  };
}

async function nextPort(): Promise<number> {
  const rows = await db.select({ port: serversTable.port }).from(serversTable);
  const used = new Set(rows.map((r) => r.port));
  for (let p = 25565; p < 25700; p++) {
    if (!used.has(p)) return p;
  }
  throw new Error("No available ports");
}

// ── Server CRUD ──────────────────────────────────────────────────────────────

router.get("/servers", async (_req, res) => {
  const rows = await db.select().from(serversTable).orderBy(desc(serversTable.createdAt));
  res.json(rows.map(toDto));
});

router.post("/servers", async (req, res) => {
  const parsed = CreateServerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, software, version, plan, maxPlayers } = parsed.data;
  const memoryMb = PLAN_MEMORY[plan] ?? 512;
  const defaultMaxPlayers = maxPlayers ?? PLAN_MAX_PLAYERS[plan] ?? 20;
  const port = await nextPort();

  const [row] = await db
    .insert(serversTable)
    .values({ name, software, version, plan, port, memoryMb, maxPlayers: defaultMaxPlayers, status: "stopped" })
    .returning();

  mc.prepareServer(row!.id, software, version).catch((err) => {
    req.log.error({ err, id: row!.id }, "Error preparing server JAR");
  });

  notifyServerCreated(row!.name, row!.id, version, plan).catch(() => {});

  res.status(201).json(toDto(row!));
});

router.get("/servers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  if (!row) { res.status(404).json({ error: "Server not found" }); return; }
  res.json(toDto(row));
});

router.delete("/servers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  mc.stopServer(id);
  await db.delete(serversTable).where(eq(serversTable.id, id));

  if (row) notifyServerDeleted(row.name, row.id).catch(() => {});

  res.status(204).end();
});

// ── Server Actions ────────────────────────────────────────────────────────────

router.post("/servers/:id/start", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  if (!row) { res.status(404).json({ error: "Server not found" }); return; }
  if (mc.isRunning(row.id)) { res.status(400).json({ error: "Already running" }); return; }

  await db.update(serversTable).set({ status: "starting", startedAt: new Date() }).where(eq(serversTable.id, row.id));

  mc.startServer(row.id, row.name, row.software, row.version, row.memoryMb, row.port).then(() => {
    db.update(serversTable).set({ status: "running" }).where(eq(serversTable.id, row.id)).catch(() => {});
    notifyServerStarted(row.name, row.id, row.port).catch(() => {});
  }).catch((err) => {
    req.log.error({ err, id: row.id }, "Failed to start server");
    db.update(serversTable).set({ status: "stopped" }).where(eq(serversTable.id, row.id)).catch(() => {});
  });

  const [updated] = await db.select().from(serversTable).where(eq(serversTable.id, row.id));
  res.json(toDto(updated!));
});

router.post("/servers/:id/stop", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  if (!row) { res.status(404).json({ error: "Server not found" }); return; }

  mc.stopServer(row.id);
  await db.update(serversTable).set({ status: "stopped", pid: null }).where(eq(serversTable.id, row.id));
  notifyServerStopped(row.name, row.id).catch(() => {});

  const [updated] = await db.select().from(serversTable).where(eq(serversTable.id, row.id));
  res.json(toDto(updated!));
});

router.post("/servers/:id/restart", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db.select().from(serversTable).where(eq(serversTable.id, id));
  if (!row) { res.status(404).json({ error: "Server not found" }); return; }

  mc.stopServer(row.id);
  await db.update(serversTable).set({ status: "starting" }).where(eq(serversTable.id, row.id));
  setTimeout(() => {
    mc.startServer(row.id, row.name, row.software, row.version, row.memoryMb, row.port).then(() => {
      notifyServerStarted(row.name, row.id, row.port).catch(() => {});
    }).catch((err) => {
      req.log.error({ err }, "Restart failed");
    });
  }, 3000);

  const [updated] = await db.select().from(serversTable).where(eq(serversTable.id, row.id));
  res.json(toDto(updated!));
});

router.post("/servers/:id/command", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = CommandBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const ok = mc.sendCommand(id, parsed.data.command);
  if (!ok) { res.status(400).json({ error: "Server is not running" }); return; }
  res.json({ error: "" });
});

router.get("/servers/:id/logs", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const lines = mc.getLogs(id);
  res.json(lines.map((line, i) => ({ id: i, line, timestamp: new Date().toISOString() })));
});

router.get("/servers/:id/metrics", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db
    .select()
    .from(serverMetricsTable)
    .where(eq(serverMetricsTable.serverId, id))
    .orderBy(desc(serverMetricsTable.recordedAt))
    .limit(60);

  res.json(rows.reverse().map((r) => ({
    id: r.id,
    playerCount: r.playerCount,
    uptimeSeconds: r.uptimeSeconds,
    recordedAt: r.recordedAt.toISOString(),
  })));
});

// ── File Manager ─────────────────────────────────────────────────────────────

function safeServerPath(serverId: number, subPath: string): string | null {
  const serverDir = mc.getServerDir(serverId);
  const target = resolve(serverDir, subPath.replace(/^\//, ""));
  if (!target.startsWith(serverDir)) return null;
  return target;
}

router.get("/servers/:id/files", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const subPath = (typeof req.query.path === "string" ? req.query.path : ".") || ".";
  const target = safeServerPath(id, subPath);
  if (!target) { res.status(400).json({ error: "Invalid path" }); return; }

  if (!existsSync(target)) {
    try { mkdirSync(target, { recursive: true }); } catch { /* ignore */ }
  }

  if (!existsSync(target)) {
    res.status(404).json({ error: "Directory not found" });
    return;
  }

  const serverDir = mc.getServerDir(id);
  const entries = readdirSync(target, { withFileTypes: true }).map((entry) => {
    const fullPath = join(target, entry.name);
    const stat = statSync(fullPath);
    const relPath = relative(serverDir, fullPath);
    return {
      name: entry.name,
      path: relPath,
      type: entry.isDirectory() ? "directory" : "file",
      size: entry.isFile() ? stat.size : 0,
      modifiedAt: stat.mtime.toISOString(),
    };
  });

  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  res.json(entries);
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "/tmp"),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

router.post("/servers/:id/files/upload", upload.single("file"), async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

  const subPath = (typeof req.query.path === "string" ? req.query.path : ".") || ".";
  const target = safeServerPath(id, subPath);
  if (!target) { res.status(400).json({ error: "Invalid path" }); return; }

  mkdirSync(target, { recursive: true });

  const destPath = join(target, req.file.originalname);
  const { renameSync } = await import("fs");
  try {
    renameSync(req.file.path, destPath);
  } catch {
    const { copyFileSync, unlinkSync: unlink } = await import("fs");
    copyFileSync(req.file.path, destPath);
    unlink(req.file.path);
  }

  const serverDir = mc.getServerDir(id);
  const stat = statSync(destPath);
  res.status(201).json({
    name: req.file.originalname,
    path: relative(serverDir, destPath),
    type: "file",
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
  });
});

router.post("/servers/:id/mods/install", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { versionId } = req.body as { versionId?: string };
  if (!versionId) { res.status(400).json({ error: "versionId is required" }); return; }

  const serverRows = await db.select().from(serversTable).where(eq(serversTable.id, id)).limit(1);
  if (!serverRows[0]) { res.status(404).json({ error: "Server not found" }); return; }
  const software = serverRows[0].software ?? "paper";

  const versionRes = await fetch(`https://api.modrinth.com/v2/version/${versionId}`, {
    headers: { "User-Agent": "VortexHosting/1.0 (vortex-hosting)" },
  });
  if (!versionRes.ok) { res.status(502).json({ error: "Modrinth API error" }); return; }

  const version = (await versionRes.json()) as {
    files: Array<{ url: string; filename: string; primary: boolean }>;
  };

  const file = version.files.find((f) => f.primary) ?? version.files[0];
  if (!file) { res.status(502).json({ error: "No files in Modrinth version" }); return; }

  const subdir = software === "fabric" ? "mods" : "plugins";
  const destDir = join(mc.getServerDir(id), subdir);
  mkdirSync(destDir, { recursive: true });
  const destPath = join(destDir, file.filename);

  const dlRes = await fetch(file.url);
  if (!dlRes.ok) { res.status(502).json({ error: "Download failed" }); return; }

  const writer = createWriteStream(destPath);
  const reader = dlRes.body!.getReader();
  await new Promise<void>((resolve, reject) => {
    writer.on("error", reject);
    writer.on("finish", resolve);
    const pump = (): void => {
      reader.read().then(({ done, value }) => {
        if (done) { writer.end(); return; }
        writer.write(Buffer.from(value));
        pump();
      }).catch(reject);
    };
    pump();
  });

  res.status(201).json({ filename: file.filename, directory: subdir });
});

router.post("/servers/:id/files/delete", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { path: filePath } = req.body as { path?: string };
  if (!filePath) { res.status(400).json({ error: "path is required" }); return; }

  const target = safeServerPath(id, filePath);
  if (!target) { res.status(400).json({ error: "Invalid path" }); return; }
  if (!existsSync(target)) { res.status(404).json({ error: "File not found" }); return; }

  const stat = statSync(target);
  if (stat.isDirectory()) {
    rmdirSync(target, { recursive: true });
  } else {
    unlinkSync(target);
  }

  res.status(204).end();
});

export default router;
