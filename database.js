/**
 * SQLite database module for bot persistence
 * Handles command logging and reminders
 */

const Database = require("better-sqlite3");
const logger = require("./logger");

let db;

/**
 * Initialize the database and create tables
 */
function initializeDatabase() {
  db = new Database("bot_logs.db");

  // Command logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS command_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_name TEXT NOT NULL,
      user_id TEXT,
      username TEXT,
      arguments TEXT,
      fetched_message TEXT,
      timestamp DATETIME NOT NULL
    )
  `);

  // Reminders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message TEXT NOT NULL,
      remind_time INTEGER NOT NULL,
      hours INTEGER NOT NULL,
      minutes INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index for faster reminder queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(remind_time)
  `);

  logger.info("Database initialized");
}

/**
 * Log a command execution
 */
function logCommand(commandName, userId, username, args, fetchedMessage = null) {
  const timestamp = new Date().toISOString();
  const stmt = db.prepare(
    "INSERT INTO command_logs (command_name, user_id, username, arguments, fetched_message, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
  );
  stmt.run(commandName, userId, username, args, fetchedMessage, timestamp);
}

/**
 * Add a new reminder
 * @returns {number} The ID of the created reminder
 */
function addReminder(userId, channelId, message, remindTime, hours, minutes) {
  const stmt = db.prepare(
    "INSERT INTO reminders (user_id, channel_id, message, remind_time, hours, minutes) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(userId, channelId, message, remindTime, hours, minutes);
  return result.lastInsertRowid;
}

/**
 * Get all reminders for a user
 * @returns {Array} Array of reminder objects
 */
function getUserReminders(userId) {
  const stmt = db.prepare(
    "SELECT * FROM reminders WHERE user_id = ? ORDER BY remind_time ASC"
  );
  return stmt.all(userId);
}

/**
 * Get all due reminders (where remind_time <= current time)
 * @returns {Array} Array of reminder objects
 */
function getDueReminders() {
  const currentTime = Date.now();
  const stmt = db.prepare(
    "SELECT * FROM reminders WHERE remind_time <= ?"
  );
  return stmt.all(currentTime);
}

/**
 * Delete a reminder by ID
 * @returns {boolean} True if a reminder was deleted
 */
function deleteReminder(reminderId) {
  const stmt = db.prepare("DELETE FROM reminders WHERE id = ?");
  const result = stmt.run(reminderId);
  return result.changes > 0;
}

/**
 * Delete a user's reminder by their entry number (1-indexed)
 * @param {string} userId - The user's ID
 * @param {number} entryNumber - The 1-indexed entry number from their list
 * @returns {boolean} True if a reminder was deleted
 */
function deleteUserReminderByIndex(userId, entryNumber) {
  const reminders = getUserReminders(userId);
  if (entryNumber < 1 || entryNumber > reminders.length) {
    return false;
  }
  const reminder = reminders[entryNumber - 1];
  return deleteReminder(reminder.id);
}

/**
 * Delete multiple reminders by their IDs
 * @param {Array<number>} ids - Array of reminder IDs to delete
 */
function deleteReminders(ids) {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(",");
  const stmt = db.prepare(`DELETE FROM reminders WHERE id IN (${placeholders})`);
  stmt.run(...ids);
}

/**
 * Get the database instance (for advanced queries)
 */
function getDb() {
  return db;
}

module.exports = {
  initializeDatabase,
  logCommand,
  addReminder,
  getUserReminders,
  getDueReminders,
  deleteReminder,
  deleteUserReminderByIndex,
  deleteReminders,
  getDb,
};
