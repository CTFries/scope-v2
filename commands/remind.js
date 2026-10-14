const {
  SlashCommandBuilder,
  memberNicknameMention,
} = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { SECURITY_LIMITS } = require("../security");
const database = require("../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription(
      "Bot will @ you with your message after X hours and Y minutes"
    )
    .addIntegerOption((option) =>
      option
        .setName("hours")
        .setDescription("Hours until reminder is sent")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Minutes until reminder is sent")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("noti")
        .setDescription("Reminder message contents")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("visible")
        .setDescription("Show to all, or just you?")
        .setRequired(false)
        .addChoice("Just me", 1)
        .addChoice("Everyone", 0)
    ),

  async execute(interaction) {
    // Grab current UNIX timestamp (timezone agnostic)
    const curTime = Date.now();

    // Recover user-entered times
    const rawMinutes = Math.abs(interaction.options.getInteger("minutes"));
    const rawHours = Math.abs(interaction.options.getInteger("hours"));
    const message = interaction.options.getString("noti");
    const userID = interaction.user.id;
    const channelId = interaction.channel.id;
    const userChoice = interaction.options.getInteger("visible");

    // Security: Bound reminder times to reasonable values (max 7 days)
    const minutes = Math.min(rawMinutes, SECURITY_LIMITS.MAX_REMINDER_MINUTES);
    const hours = Math.min(rawHours, SECURITY_LIMITS.MAX_REMINDER_HOURS);

    // If both are set to 0, error out
    if (minutes == 0 && hours == 0) {
      return interaction.reply({
        content:
          "**Warning:** No reminder set, must enter a non-zero value for hours and/or minutes.",
        ephemeral: true,
      });
    }

    // Convert minutes and hours to milliseconds
    const remindTime = curTime + (minutes * 60 * 1000 + hours * 3600 * 1000);

    // Add reminder to SQLite database
    database.addReminder(userID, channelId, message, remindTime, hours, minutes);

    const embedContent = `In **${hours} hour(s)** and **${minutes} minutes**:

${message}`;

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`Reminder set for ${interaction.user.username}`)
      .setDescription(embedContent);
    return interaction.reply({ embeds: [embed], ephemeral: userChoice });
  },
};
