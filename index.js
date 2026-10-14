require("dotenv").config();
const fs = require("fs");
const { Client, Collection, Intents } = require("discord.js");
const client = new Client({
  partials: ["CHANNEL"],
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
});
const logger = require("./logger");
const { safeJSONParse } = require("./security");
const database = require("./database");

function loadBannedUsers() {
  try {
    const data = fs.readFileSync("./bannedUsers.json", "utf8");
    const parsed = safeJSONParse(data, { bannedUsers: [] });
    return new Set(parsed.bannedUsers || []);
  } catch (err) {
    logger.warn(
      "Could not load bannedUsers.json, starting with empty ban list",
    );
    return new Set();
  }
}

let bannedUsers = loadBannedUsers();

function isUserBanned(userId) {
  return bannedUsers.has(userId);
}

function reloadBanList() {
  bannedUsers = loadBannedUsers();
  logger.info(`Ban list reloaded. ${bannedUsers.size} users banned.`);
}

// Simple per-user rate limit: at most RATE_LIMIT_MAX commands per RATE_LIMIT_WINDOW_MS
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 5;
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000;
const commandTimestamps = new Map();

function isRateLimited(userId) {
  const now = Date.now();
  const recent = (commandTimestamps.get(userId) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    commandTimestamps.set(userId, recent);
    return true;
  }
  recent.push(now);
  commandTimestamps.set(userId, recent);
  return false;
}

// Drop stale entries so the map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of commandTimestamps) {
    if (timestamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
      commandTimestamps.delete(userId);
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref();

client.on("ready", () => logger.info("The bot is online"));
client.on("debug", (m) => logger.debug(m));
client.on("warn", (m) => logger.warn(m));
client.on("error", (m) => logger.error(m));
client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log("Ready!");
  database.initializeDatabase();

  const cron = require("node-cron");
  const task = cron.schedule("*/15 * * * * *", () => {
    try {
      // Get all due reminders from SQLite
      const dueReminders = database.getDueReminders();

      if (dueReminders.length === 0) return;

      const completedIds = [];

      for (const reminder of dueReminders) {
        const notify = `<@!${reminder.user_id}>: ${reminder.message}

Reminder set ${reminder.hours} hour(s) and ${reminder.minutes} minutes ago.`;

        // Check channel exists before sending
        const targetChannel = client.channels.cache.get(reminder.channel_id);
        if (targetChannel) {
          targetChannel.send(notify).catch((err) => {
            logger.error("Failed to send reminder:", err.message);
          });
        } else {
          logger.warn(`Channel ${reminder.channel_id} not found for reminder`);
        }

        completedIds.push(reminder.id);
      }

      // Delete all sent reminders in one query
      if (completedIds.length > 0) {
        database.deleteReminders(completedIds);
        console.log(`Processed ${completedIds.length} reminder(s)`);
      }
    } catch (err) {
      logger.error("Error processing reminders:", err.message);
    }
  });

  task.start();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;
  if (interaction.isCommand()) {
    // Check if user is banned before processing any command
    if (isUserBanned(interaction.user.id)) {
      logger.warn({
        event: "BANNED_USER_ATTEMPT",
        command: interaction.commandName,
        user: interaction.user.username + "#" + interaction.user.discriminator,
        userId: interaction.user.id,
      });
      return interaction.reply({
        content: "Your access to this bot has been revoked.",
        ephemeral: true,
      });
    }

    if (isRateLimited(interaction.user.id)) {
      logger.warn({
        event: "RATE_LIMITED",
        command: interaction.commandName,
        user: interaction.user.username + "#" + interaction.user.discriminator,
        userId: interaction.user.id,
      });
      return interaction.reply({
        content: `Slow down! You can use up to ${RATE_LIMIT_MAX} commands every ${RATE_LIMIT_WINDOW_MS / 1000} seconds.`,
        ephemeral: true,
      });
    }

    // Extract command arguments as JSON string
    const args = JSON.stringify(
      interaction.options.data.map((opt) => ({
        name: opt.name,
        value: opt.value,
      })),
    );
    const username =
      interaction.user.username + "#" + interaction.user.discriminator;

    logger.info({
      command: interaction.commandName,
      user: username,
      options: interaction.options,
    });

    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
      // Log the command to SQLite after execution (to capture fetchedMessageContent if set)
      const fetchedMessage = interaction.fetchedMessageContent || null;
      database.logCommand(
        interaction.commandName,
        interaction.user.id,
        username,
        args,
        fetchedMessage,
      );
    } catch (error) {
      console.error(error);
      // Still log the command even on error
      const fetchedMessage = interaction.fetchedMessageContent || null;
      database.logCommand(
        interaction.commandName,
        interaction.user.id,
        username,
        args,
        fetchedMessage,
      );
      return interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
  if (interaction.isButton()) {
    logger.info("button clicked");
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);
