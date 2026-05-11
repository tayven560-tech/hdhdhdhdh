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

export function notifyNewVersionAvailable(software: string, version: string, releaseUrl: string) {
  return notify({
    title: `🆕 New ${software} version available`,
    description: `A new version of **${software}** has been released.`,
    color: "info",
    fields: [
      { name: "Version", value: version, inline: true },
      { name: "Software", value: software, inline: true },
      { name: "Release", value: releaseUrl, inline: false },
    ],
  });
}
