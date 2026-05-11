import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Interaction,
} from "discord.js";
import { db, serversTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import * as mc from "../mc/manager";

const PLAN_MEMORY: Record<string, number> = {
  free: 512,
  premium: 5120,
  enterprise: 10240,
};

const TOKEN = process.env["DISCORD_BOT_TOKEN"];
const CLIENT_ID = process.env["DISCORD_CLIENT_ID"];
const GUILD_ID = process.env["DISCORD_GUILD_ID"];

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("servers")
    .setDescription("List all Vortex Hosting servers"),

  new SlashCommandBuilder()
    .setName("server")
    .setDescription("Manage a Vortex Hosting server")
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Show server status")
        .addIntegerOption((o) =>
          o.setName("id").setDescription("Server ID").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a server")
        .addIntegerOption((o) =>
          o.setName("id").setDescription("Server ID").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("stop")
        .setDescription("Stop a server")
        .addIntegerOption((o) =>
          o.setName("id").setDescription("Server ID").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("restart")
        .setDescription("Restart a server")
        .addIntegerOption((o) =>
          o.setName("id").setDescription("Server ID").setRequired(true)
        )
    ),
].map((c) => c.toJSON());

const STATUS_EMOJI: Record<string, string> = {
  running: "🟢",
  stopped: "🔴",
  starting: "🟡",
  stopping: "🟠",
};

const SOFTWARE_EMOJI: Record<string, string> = {
  paper: "📄",
  leaf: "🌿",
  fabric: "🧵",
};

function statusEmoji(status: string) {
  return STATUS_EMOJI[status] ?? "⚪";
}

function softwareEmoji(sw: string | null) {
  return SOFTWARE_EMOJI[sw ?? "paper"] ?? "📄";
}

async function handleServers(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const servers = await db.select().from(serversTable);

  if (servers.length === 0) {
    await interaction.editReply("No servers found.");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("🌀 Vortex Hosting — Servers")
    .setColor(0x7c3aed)
    .setTimestamp()
    .setFooter({ text: "Vortex Hosting" });

  for (const s of servers) {
    const isRunning = mc.isRunning(s.id);
    const status = isRunning ? "running" : "stopped";
    const players = isRunning ? mc.getPlayerCount(s.id) : 0;
    embed.addFields({
      name: `${statusEmoji(status)} ${s.name} (ID: ${s.id})`,
      value: [
        `**Software:** ${softwareEmoji(s.software)} ${s.software ?? "paper"}`,
        `**Version:** ${s.version}`,
        `**Plan:** ${s.plan}`,
        `**Port:** ${s.port}`,
        isRunning ? `**Players:** ${players}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      inline: true,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleServer(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const id = interaction.options.getInteger("id", true);

  const rows = await db
    .select()
    .from(serversTable)
    .where(eq(serversTable.id, id))
    .limit(1);
  const server = rows[0];

  if (!server) {
    await interaction.reply({ content: `❌ No server found with ID **${id}**.`, ephemeral: true });
    return;
  }

  if (sub === "status") {
    await interaction.deferReply();
    const isRunning = mc.isRunning(id);
    const status = isRunning ? "running" : "stopped";
    const uptime = isRunning ? mc.getUptimeSeconds(id) : null;
    const players = isRunning ? mc.getPlayerCount(id) : 0;

    const embed = new EmbedBuilder()
      .setTitle(`${statusEmoji(status)} ${server.name}`)
      .setColor(isRunning ? 0x22c55e : 0x64748b)
      .addFields(
        { name: "Status", value: status, inline: true },
        { name: "Software", value: `${softwareEmoji(server.software)} ${server.software ?? "paper"}`, inline: true },
        { name: "Version", value: server.version, inline: true },
        { name: "Plan", value: server.plan, inline: true },
        { name: "Port", value: String(server.port), inline: true },
        ...(isRunning
          ? [
              { name: "Players", value: String(players), inline: true },
              {
                name: "Uptime",
                value: uptime != null ? `${Math.floor(uptime / 60)}m ${uptime % 60}s` : "—",
                inline: true,
              },
            ]
          : [])
      )
      .setTimestamp()
      .setFooter({ text: "Vortex Hosting" });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (sub === "start") {
    await interaction.deferReply();
    if (mc.isRunning(id)) {
      await interaction.editReply(`⚠️ **${server.name}** is already running.`);
      return;
    }
    try {
      await mc.startServer(id, server.name, server.software, server.version, server.memoryMb, server.port);
      await interaction.editReply(`✅ **${server.name}** is starting up on port **${server.port}**.`);
    } catch (err) {
      await interaction.editReply(`❌ Failed to start **${server.name}**: ${String(err)}`);
    }
    return;
  }

  if (sub === "stop") {
    await interaction.deferReply();
    if (!mc.isRunning(id)) {
      await interaction.editReply(`⚠️ **${server.name}** is not running.`);
      return;
    }
    try {
      mc.stopServer(id);
      await interaction.editReply(`🛑 **${server.name}** has been stopped.`);
    } catch (err) {
      await interaction.editReply(`❌ Failed to stop **${server.name}**: ${String(err)}`);
    }
    return;
  }

  if (sub === "restart") {
    await interaction.deferReply();
    try {
      mc.stopServer(id);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const memoryMb = PLAN_MEMORY[server.plan] ?? 512;
      await mc.startServer(id, server.name, server.software, server.version, memoryMb, server.port);
      await interaction.editReply(`🔄 **${server.name}** has been restarted.`);
    } catch (err) {
      await interaction.editReply(`❌ Failed to restart **${server.name}**: ${String(err)}`);
    }
    return;
  }
}

export async function startBot(): Promise<void> {
  if (!TOKEN || !CLIENT_ID) {
    logger.info("Discord bot skipped — DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID not set");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: COMMANDS });
      logger.info({ guildId: GUILD_ID }, "Discord slash commands registered (guild)");
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: COMMANDS });
      logger.info("Discord slash commands registered (global — may take up to 1h)");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to register Discord slash commands");
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", () => {
    logger.info({ tag: client.user?.tag }, "Discord bot ready");
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      if (interaction.commandName === "servers") {
        await handleServers(interaction);
      } else if (interaction.commandName === "server") {
        await handleServer(interaction);
      }
    } catch (err) {
      logger.error({ err }, "Error handling Discord interaction");
      const reply = { content: "❌ An error occurred while processing this command.", ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply.content).catch(() => null);
      } else {
        await interaction.reply(reply).catch(() => null);
      }
    }
  });

  await client.login(TOKEN);
}
