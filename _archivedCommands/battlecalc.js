const numeral = require("numeral");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log10 } = require("mathjs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battlecalc")
    .setDescription("Takes OP and DP, gives % chance")
    .addIntegerOption((option) =>
      option.setName("op").setDescription("Attacking army OP").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("dp").setDescription("Defending army DP").setRequired(true)
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
    const OP = interaction.options.getInteger("op");
    const DP = interaction.options.getInteger("dp");
    const userChoice = interaction.options.getInteger("visible");
    let OPDP = 0;
    let chance = 0;

    OPDP = OP / DP;

    chance =
      Math.round((1 - 1 / (1 + Math.pow(10, 5 * log10(OPDP)))) * 1000) / 10;

    const embedContent = `**Attacker OP:** ${OP}
**Defender DP:** ${DP}
**OP/DP Ratio:** ${OPDP}
\`\`\`Chance To Win: ${chance}%\`\`\``;

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`${interaction.user.username} - Army vs Army Chances`)
      .setDescription(embedContent);
    return await interaction.reply({ embeds: [embed], ephemeral: userChoice });
  },
};
