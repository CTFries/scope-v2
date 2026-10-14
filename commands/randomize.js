const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("randomize")
    .setDescription(
      "Randomly assigns unique numbers to a list of names (e.g., for spawn corner draws)",
    )
    .addStringOption((option) =>
      option
        .setName("names")
        .setDescription(
          "Comma-separated list of names (e.g., KD1, KD2, KD3, KD4)",
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Custom title for the result (optional)")
        .setRequired(false),
    ),

  async execute(interaction) {
    const input = interaction.options.getString("names");
    const title =
      interaction.options.getString("title") || "Random Draw Results";

    // Parse names from comma-separated input
    const names = input
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    // Validate input
    if (names.length < 2) {
      const embed = new MessageEmbed()
        .setColor(0xff0000)
        .setTitle("Input Error")
        .setDescription("Please provide at least 2 names separated by commas.");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (names.length > 25) {
      const embed = new MessageEmbed()
        .setColor(0xff0000)
        .setTitle("Input Error")
        .setDescription("Maximum of 25 names allowed.");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Generate array of numbers 1 to N
    const numbers = Array.from({ length: names.length }, (_, i) => i + 1);

    // Fisher-Yates shuffle for unbiased randomization
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Build results sorted by assigned number
    const paired = names.map((name, index) => ({ name, number: numbers[index] }));
    paired.sort((a, b) => a.number - b.number);
    const results = paired.map((p) => `**${p.number}:** ${p.name}`);

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(title)
      .setDescription(results.join("\n"))
      .setFooter(`${names.length} entries randomized`);

    return interaction.reply({ embeds: [embed] });
  },
};
