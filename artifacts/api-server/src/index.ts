import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { wss } from "./mc/manager";
import { notifyOnline, notifyOffline, notifyWebsiteUpdated } from "./lib/discord";
import { startBot } from "./lib/discord-bot";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);

server.on("upgrade", (request, socket, head) => {
  if (request.url?.match(/\/api\/servers\/\d+\/ws/)) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, async () => {
  logger.info({ port }, "Server listening (HTTP + WebSocket)");
  await notifyOnline();
  await notifyWebsiteUpdated();
  startBot().catch((err) => logger.warn({ err }, "Discord bot failed to start"));
});

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");
  await notifyOffline();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
