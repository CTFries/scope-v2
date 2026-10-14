const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const numeral = require("numeral");

function prep(troops, citySize) {
  return (Math.pow(troops, 0.3) * citySize) / 12 + 3;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prep")
    .setDescription(
      "Determines max prep based on city visual size and troop counts."
    )
    .addIntegerOption((option) =>
      option
        .setName("troops")
        .setDescription("Total troop count")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("size")
        .setDescription("Visual size of city")
        .setRequired(true)
        .addChoice("1 (400 max)", 1)
        .addChoice("2 (6,400 max)", 2)
        .addChoice("3 (14,400 max)", 3)
        .addChoice("4 (25,600 max)", 4)
        .addChoice("5 (40,000 max)", 5)
        .addChoice("6 (57,600 max)", 6)
        .addChoice("7 (78,200 max)", 7)
        .addChoice("8 (90,000 max)", 8)
        .addChoice("9 (200,000 max)", 9)
    ),

  async execute(interaction) {
    let troops = interaction.options.getInteger("troops");
    let citySize = interaction.options.getInteger("size");
    let walls = 0;

    if (citySize == 1) {
      walls = 157;
    } else if (citySize == 2) {
      walls = 630;
    } else if (citySize == 3) {
      walls = 945;
    } else if (citySize == 4) {
      walls = 1260;
    } else if (citySize == 5) {
      walls = 1575;
    } else if (citySize == 6) {
      walls = 1890;
    } else if (citySize == 7) {
      walls = 2202;
    } else if (citySize == 8) {
      walls = 2362;
    } else if (citySize == 9) {
      walls = 3522;
      citySize = 8;
    }

    let results = prep(troops, citySize);

    const embedContent = `**${troops}** troops attacking city size **${citySize}**:\`\`\`00% Walls (${numeral(
      walls * 0
    )
      .format("00")
      .toString()
      .padStart(4, "0")}) | ${Math.ceil(results)} ticks\n25% Walls (${numeral(
      walls * 0.25
    )
      .format("00")
      .toString()
      .padStart(4, "0")}) | ${Math.ceil(
      results * 1.25
    )} ticks\n50% Walls (${numeral(walls * 0.5)
      .format("00")
      .toString()
      .padStart(4, "0")}) | ${Math.ceil(
      results * 1.5
    )} ticks\n75% Walls (${numeral(walls * 0.75)
      .format("00")
      .toString()
      .padStart(4, "0")}) | ${Math.ceil(
      results * 1.75
    )} ticks\nMax Walls (${numeral(walls)
      .format("00")
      .toString()
      .padStart(4, "0")}) | ${Math.ceil(results * 2)} ticks\`\`\`
Wall count assumes city is built to max for its size.`;

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`Estimated City Prep`)
      .setDescription(embedContent);
    return interaction.reply({ embeds: [embed] });
  },
};
