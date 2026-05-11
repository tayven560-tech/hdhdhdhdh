import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serversTable = pgTable("servers", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  software: text("software").notNull().default("paper"),
  version: text("version").notNull().default("1.21.4"),
  plan: text("plan").notNull().default("free"),
  port: integer("port").notNull(),
  status: text("status").notNull().default("stopped"),
  memoryMb: integer("memory_mb").notNull().default(512),
  maxPlayers: integer("max_players").notNull().default(20),
  pid: integer("pid"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertServerSchema = createInsertSchema(serversTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof serversTable.$inferSelect;

export const serverLogsTable = pgTable("server_logs", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull().references(() => serversTable.id, { onDelete: "cascade" }),
  line: text("line").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServerLogSchema = createInsertSchema(serverLogsTable).omit({
  id: true,
  timestamp: true,
});
export type InsertServerLog = z.infer<typeof insertServerLogSchema>;
export type ServerLog = typeof serverLogsTable.$inferSelect;

export const serverMetricsTable = pgTable("server_metrics", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull().references(() => serversTable.id, { onDelete: "cascade" }),
  playerCount: integer("player_count").notNull().default(0),
  uptimeSeconds: integer("uptime_seconds").notNull().default(0),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServerMetricSchema = createInsertSchema(serverMetricsTable).omit({
  id: true,
  recordedAt: true,
});
export type InsertServerMetric = z.infer<typeof insertServerMetricSchema>;
export type ServerMetric = typeof serverMetricsTable.$inferSelect;
