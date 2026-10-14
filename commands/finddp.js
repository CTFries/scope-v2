const numeral = require("numeral");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log10 } = require("mathjs");
const { safeChance, safeOPDP } = require("../security");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("finddp")
    .setDescription("Takes OP % chance, gives DP")
    .addIntegerOption((option) =>
      option.setName("op").setDescription("Attacking army OP").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("chance").setDescription("Attacker chances").setRequired(true)
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
    const rawOP = interaction.options.getInteger("op");
    const rawChance = interaction.options.getInteger("chance");
    const userChoice = interaction.options.getInteger("visible");

    // Security: Validate inputs - chance must be 1-99 to avoid division by zero
    // (chance of 0 causes 0/0, chance of 100 causes division by 0)
    const OP = safeOPDP(rawOP);
    const chance = safeChance(rawChance);

    // Security: Check for edge cases that could cause math errors
    if (chance <= 0 || chance >= 100) {
      const embed = new MessageEmbed()
        .setColor(0xFF0000)
        .setTitle("Invalid Chance Value")
        .setDescription("Chance must be between 1 and 99 percent.");
      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Security: Safe calculation - chance is now guaranteed to be 1-99
    const chanceDecimal = chance / 100;
    const denominator = 1 - chanceDecimal;
    let curRatio = Math.pow(chanceDecimal / denominator, 0.2);

    // Security: Protect against curRatio being zero or invalid
    if (!isFinite(curRatio) || curRatio === 0) {
      const embed = new MessageEmbed()
        .setColor(0xFF0000)
        .setTitle("Calculation Error")
        .setDescription("Could not calculate DP with the provided values.");
      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    let DP = OP / curRatio;

    const embedContent = `Attacker OP: *${numeral(OP).format('0,0')}*
OP/DP Ratio: *${Math.round(curRatio*100)/100}*
Current Chance: *${chance}%*

**Enemy DP: *${numeral(DP).format('0,0')}***`;

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`${interaction.user.username} - Find Defender DP`)
      .setDescription(embedContent);
    return await interaction.reply({ embeds: [embed], ephemeral: userChoice });
  },
};
