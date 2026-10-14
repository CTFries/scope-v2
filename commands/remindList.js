const {
  SlashCommandBuilder,
  memberNicknameMention,
} = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const database = require("../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remindlist")
    .setDescription("List upcoming reminders you have set"),

  async execute(interaction) {
    // Grab current UNIX timestamp (timezone agnostic)
    const curTime = Date.now();

    // Get user's reminders from SQLite
    const reminders = database.getUserReminders(interaction.user.id);

    let embedContent = [];

    if (reminders.length === 0) {
      embedContent.push(
        `No reminders have been set.\nUse /remind to set a new reminder.`
      );
    } else {
      for (let i = 0; i < reminders.length; i++) {
        const reminder = reminders[i];
        const timeDif = (reminder.remind_time - curTime) / 1000;
        const hours = Math.floor(timeDif / 3600);
        const minutes = Math.floor((timeDif - 3600 * hours) / 60);

        if (hours <= 0 && minutes <= 0) {
          embedContent.push(
            `[${i + 1}]: **Less than 1 minute**\n*${reminder.message}*\n`
          );
        } else {
          embedContent.push(
            `[${i + 1}]: **${hours} hours and ${minutes} minutes**\n*${reminder.message}*\n`
          );
        }
      }
    }

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`Reminder List for: ${interaction.user.username}`)
      .setDescription(embedContent.join(""));
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
