const { SlashCommandBuilder } = require("@discordjs/builders");
module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("pongs!"),
  async execute(interaction) {
    return await interaction.reply("pong!");
  },
};
