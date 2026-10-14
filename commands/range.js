const numeral = require("numeral");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("range")
    .setDescription(
      "Determine MT range given X MTs, or find MTs needed to reach Y range."
    )
    .addStringOption((option) =>
      option
        .setName("race")
        .setDescription("Race to calculate for")
        .setRequired(true)
        .addChoice("Elf", "Elf")
        .addChoice("All others", "Non-Elf")
    )
    .addIntegerOption((option) =>
      option
        .setName("mts")
        .setDescription("MT count of target")
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("distance")
        .setDescription("Scout ticks required to reach target")
        .setRequired(false)
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
    const userRace = interaction.options.getString("race");
    const inputMTcount = interaction.options.getInteger("mts")
      ? interaction.options.getInteger("mts")
      : -2;
    const inputMTrange = interaction.options.getNumber("distance")
      ? interaction.options.getNumber("distance")
      : -2;
    const userChoice = interaction.options.getInteger("visible");
    let outputMTrange = 0;
    let outputMTcount = 0;
    let rangeIn = false;
    let countIn = false;

    if (userRace == "Elf") {
      // Scout tick range, so find MTs required
      if (inputMTrange > 0) {
        rangeIn = true;
        outputMTcount =
          55.174 * Math.pow(inputMTrange, 2) - 116.78 * inputMTrange + 76.052;
      }

      // MT count is given, so find scout tick range
      if (inputMTcount > 0) {
        countIn = true;
        outputMTrange =
          (116.78 +
            Math.pow(
              116.78 * 116.78 - 4 * 55.174 * (76.052 - inputMTcount),
              0.5
            )) /
          (2 * 55.174);
      }
    } else {
      // Scout tick range, so find MTs required
      if (inputMTrange > 0) {
        rangeIn = true;
        outputMTcount =
          66.085 * Math.pow(inputMTrange, 2) - 131.6 * inputMTrange + 68.304;
      }

      // MT count is given, so find scout tick range
      if (inputMTcount > 0) {
        countIn = true;
        outputMTrange =
          0.995687 + 2 * Math.pow(0.00378301 * inputMTcount - 0.01054616, 0.5);
      }
    }

    const rangeEst = `Race: **${userRace}**
${
  countIn
    ? `\nMTs of target:     *${numeral(inputMTcount).format("0,0")}*
Est Target Range:  *${numeral(outputMTrange).format("0.00")}*\n`
    : ""
}${
      rangeIn
        ? `\nTarget Distance:   *${numeral(inputMTrange).format("0.00")}* 
Est MTs Required:  *${numeral(outputMTcount).format("0,0")}*\n`
        : ""
    }
**Distance unit**: Big X's w/ 1 T1 unit`;

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`Magic Range Estimation`)
      .setDescription(rangeEst);
    return interaction.reply({ embeds: [embed], ephemeral: userChoice });
  },
};
