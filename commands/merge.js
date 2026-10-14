const numeral = require("numeral");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { SECURITY_LIMITS, safeXP, logSecurityLimit } = require("../security");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("merge")
    .setDescription(
      "Calculates how many troops you can to merge to get to a certain XP."
    )
    .addIntegerOption((option) =>
      option
        .setName("existing_troops")
        .setDescription("# of troops in the army")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("xp")
        .setDescription("Amount of XP in the army")
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
    const existingTroops = interaction.options.getInteger("existing_troops");
    const rawXp = interaction.options.getInteger("xp");
    const userChoice = interaction.options.getInteger("visible");

    // Security: Bound XP value to prevent resource exhaustion
    // XP in game is typically 1-99, cap at 100 for safety
    const xp = safeXP(rawXp);

    // Log if value was clamped (potential attack attempt)
    if (rawXp !== xp) {
      logSecurityLimit('merge.js', 'xp', rawXp, xp);
    }

    // Security: Validate XP is at least 2 (otherwise loop doesn't make sense)
    if (xp < 2) {
      const embed = new MessageEmbed()
        .setColor(0xFF0000)
        .setTitle("Invalid XP Value")
        .setDescription("XP must be at least 2 to calculate merge values.");
      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embedContent = [
      `**${numeral(existingTroops).format("0,0")} troops with ${xp} XP**`,
      "```",
      "XP | # of troops to add",
      "----------------",
    ];

    // Security: Loop is now bounded by safeXP (max 100 iterations)
    for (let i = xp - 1; i > 0; i--) {
      const newTroops = Math.floor((existingTroops * xp) / i) - existingTroops;
      embedContent.push(
        `${numeral(i).format("00")} | ${numeral(newTroops).format("0,0")}`
      );
    }
    embedContent.push("```");
    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`XP Merge calculation`)
      .setDescription(embedContent.join("\n"))
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], ephemeral: userChoice });
  },
};
