import { logger } from "./logger";

const WEBHOOK_URL = process.env["DISCORD_WEBHOOK_URL"];

export type AlertColor = "online" | "offline" | "warning" | "info" | "danger";

const COLORS: Record<AlertColor, number> = {
  online: 0x3b82f6,
  offline: 0x64748b,
  warning: 0xf59e0b,
  info: 0x6366f1,
  danger: 0xef4444,
};

interface Field {
  name: string;
  value: string;
  inline?: boolean;
}

interface NotifyOptions {
  title: string;
  description?: string;
  color?: AlertColor;
  fields?: Field[];
}

export async function notify(opts: NotifyOptions): Promise<void> {
  if (!WEBHOOK_URL) return;

  const body = {
    embeds: [
      {
        title: opts.title,
        description: opts.description,
        color: COLORS[opts.color ?? "info"],
        fields: opts.fields ?? [],
        footer: { text: "Vortex Hosting" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "Discord webhook returned non-OK status");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to send Discord notification");
  }
}

export function notifyOnline() {
  return notify({
    title: "🌀 Vortex Hosting is online",
    description: "The API server has started successfully and is accepting connections.",
    color: "online",
  });
}

export function notifyOffline() {
  return notify({
    title: "🔴 Vortex Hosting is going offline",
    description: "The API server is shutting down.",
    color: "offline",
  });
}

export function notifyWebsiteUpdated() {
  const version = process.env["npm_package_version"] ?? "latest";
  return notify({
    title: "🚀 Vortex Hosting website updated",
    description: "The panel and API server have been redeployed with the latest changes.",
    color: "info",
    fields: [
      { name: "Version", value: version, inline: true },
      { name: "Environment", value: process.env["NODE_ENV"] ?? "production", inline: true },
    ],
  });
}

export function notifyServerCreated(name: string, id: number, version: string, plan: string) {
  return notify({
    title: "New server deployed",
    color: "info",
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "ID", value: String(id), inline: true },
      { name: "Version", value: version, inline: true },
      { name: "Plan", value: plan, inline: true },
    ],
  });
}

export function notifyServerStarted(name: string, id: number, port: number) {
  return notify({
    title: "Server started",
    color: "online",
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "ID", value: String(id), inline: true },
      { name: "Port", value: String(port), inline: true },
    ],
  });
}

export function notifyServerStopped(name: string, id: number) {
  return notify({
    title: "Server stopped",
    color: "offline",
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "ID", value: String(id), inline: true },
    ],
  });
}

export function notifyServerCrashed(name: string, id: number, exitCode: number | null) {
  return notify({
    title: "Server crashed",
    description: "A Minecraft server exited unexpectedly.",
    color: "danger",
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "ID", value: String(id), inline: true },
      { name: "Exit code", value: String(exitCode ?? "unknown"), inline: true },
    ],
  });
}

export function notifyServerDeleted(name: string, id: number) {
  return notify({
    title: "Server deleted",
    color: "warning",
    fields: [
      { name: "Name", value: name, inline: true },
      { name: "ID", value: String(id), inline: true },
    ],
  });
}
