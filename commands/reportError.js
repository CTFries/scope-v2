const {
  SlashCommandBuilder,
  memberNicknameMention,
} = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { fetchPreviousMessage } = require("../helpers");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reporterror")
    .setDescription(
      "Paste the message yielding errors, call this command, then send Percy what the bot sends back.",
    )
    .addStringOption((option) =>
      option
        .setName("commandused")
        .setDescription("What command has the error?")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Message describing whats wrong.")
        .setRequired(true),
    ),

  async execute(interaction, client) {
    const messageContent = await fetchPreviousMessage(interaction);

    // Get user's error report message
    const description = interaction.options.getString("description");
    const commandUsed = interaction.options.getString("commandused");

    const errorLog = `User's description of the problem:
${description}

Real:
${messageContent || "(no message found)"}

Converted:
${messageContent ? new TextEncoder().encode(messageContent) : "(no message)"}`;

    const embed1 = new MessageEmbed()
      .setColor(2123412)
      .setTitle(
        `New Error from ${interaction.user.username} with "${commandUsed}".`,
      )
      .setDescription(errorLog.substring(0, 4096)); // Discord embed description limit

    const errorChannel = client.guilds.cache
      .get(process.env.ERROR_REPORT_GUILD_ID)
      ?.channels.cache.get(process.env.ERROR_REPORT_CHANNEL_ID);
    if (errorChannel) {
      errorChannel.send({ embeds: [embed1] });
    }

    const embedContent = `You have successfully reported the error.`;
    const embed2 = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`Error report submission.`)
      .setDescription(embedContent);

    return interaction.reply({ embeds: [embed2] });
  },
};
