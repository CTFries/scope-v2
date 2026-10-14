const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const database = require("../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reminddelete")
    .setDescription("Delete upcoming reminders. Run /remindlist first.")
    .addIntegerOption((option) =>
      option
        .setName("entry")
        .setDescription("Type the entry number to delete")
        .setRequired(true)
    ),

  async execute(interaction) {
    const deleteEntry = Math.abs(interaction.options.getInteger("entry"));

    // If entry is 0, error out
    if (deleteEntry == 0) {
      return interaction.reply({
        content:
          "**Warning:** No entries deleted, must enter a non-zero value.",
        ephemeral: true,
      });
    }

    // Get user's reminders
    const userReminders = database.getUserReminders(interaction.user.id);

    if (userReminders.length === 0) {
      return interaction.reply({
        content: "You have no active reminders, no entries deleted.",
        ephemeral: true,
      });
    }

    if (deleteEntry > userReminders.length) {
      return interaction.reply({
        content: `Entry #${deleteEntry} does not exist. You have ${userReminders.length} reminder(s).`,
        ephemeral: true,
      });
    }

    // Delete the reminder
    const deleted = database.deleteUserReminderByIndex(interaction.user.id, deleteEntry);

    if (deleted) {
      return interaction.reply({
        content: `Deleted entry #${deleteEntry}, reminder successfully removed from scheduler.`,
        ephemeral: true,
      });
    } else {
      return interaction.reply({
        content: "Failed to delete reminder. Please try again.",
        ephemeral: true,
      });
    }
  },
};
