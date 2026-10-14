const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const numeral = require("numeral");
const races = require("../resources/units");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("army")
    .setDescription("Provides the OP & DP of given troops")
    .addStringOption((option) =>
      option
        .setName("race")
        .setDescription("Race to calculate for")
        .setRequired(true)
        .addChoice("Orc", "orc")
        .addChoice("Halfling", "halfling")
        .addChoice("Elf", "elf")
        .addChoice("Dwarf", "dwarf")
        .addChoice("Human", "human")
        .addChoice("Troll", "troll")
    )
    .addIntegerOption((option) =>
      option
        .setName("military")
        .setDescription("The military science level")
        .setRequired(true)
        .addChoice("0", 0)
        .addChoice("1", 1)
        .addChoice("2", 2)
        .addChoice("3", 3)
        .addChoice("4", 4)
        .addChoice("5", 5)
        .addChoice("6", 6)
        .addChoice("7", 7)
        .addChoice("8", 8)
        .addChoice("9", 9)
        .addChoice("10", 10)
    )
    .addIntegerOption((option) =>
      option
        .setName("magic")
        .setDescription("The magic science level")
        .setRequired(true)
        .addChoice("0", 0)
        .addChoice("1", 1)
        .addChoice("2", 2)
        .addChoice("3", 3)
        .addChoice("4", 4)
        .addChoice("5", 5)
        .addChoice("6", 6)
        .addChoice("7", 7)
        .addChoice("8", 8)
        .addChoice("9", 9)
        .addChoice("10", 10)
    )
    .addIntegerOption((option) =>
      option
        .setName("t1")
        .setDescription("Tier 1 troop count")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("t2")
        .setDescription("Tier 2 troop count")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("t3")
        .setDescription("Tier 3 troop count")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("t4")
        .setDescription("Tier 4 troop count")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("t5")
        .setDescription("Tier 5 troop count")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("morale")
        .setDescription("Non-0 Morale of Army")
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("bless")
        .setDescription("% Bless of Army")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName("xp").setDescription("XP of Army").setRequired(false)
    ),
  async execute(interaction) {
    const military = interaction.options.getInteger("military");
    const magic = Number(
      interaction.options.getInteger("magic")
        ? interaction.options.getInteger("magic")
        : 0
    );
    const race = interaction.options.getString("race");
    const u1 = interaction.options.getInteger("t1");
    const u2 = interaction.options.getInteger("t2");
    const u3 = interaction.options.getInteger("t3");
    const u4 = interaction.options.getInteger("t4");
    const u5 = interaction.options.getInteger("t5");
    const bless = Number(
      interaction.options.getNumber("bless")
        ? interaction.options.getNumber("bless")
        : 0
    );
    const xp = Number(
      interaction.options.getInteger("xp")
        ? interaction.options.getInteger("xp")
        : 0
    );
    const morale = Number(
      interaction.options.getInteger("morale")
        ? interaction.options.getInteger("morale")
        : 100
    );
    const input = [u1, u2, u3, u4, u5];
    const units = races[race];
    let op = 0;
    let dp = 0;
    let cost = 0;
    const unitBase = "u";

    for (i = 1; i < 6; i++) {
      let unitType = unitBase.concat(i);
      let unitName = units[unitType].name;

      if (unitName !== "Archmages") {
        op = op + input[i - 1] * units[unitType].op;
        dp = dp + input[i - 1] * units[unitType].dp;
        cost = cost + input[i - 1] * units[unitType].cost;
      } else {
        op = op + input[i - 1] * 3 * magic;
        dp = dp + input[i - 1] * 3 * magic;
        cost = cost + input[i - 1] * units[unitType].cost;
      }
    }

    op = Math.round(
      op *
        (1 + military / 10) *
        (1 + bless / 100) *
        (1 + xp / 50) *
        ((1 + morale / 100) / 2)
    );
    dp = Math.round(
      dp *
        (1 + military / 10) *
        (1 + bless / 100) *
        (1 + xp / 50) *
        ((1 + morale / 100) / 2)
    );

    let dieOP = dp * 3;
    let killDP = op / 3;

    const embedContent = `Total OP: **${numeral(op).format(0, 0)}**
Total DP: **${numeral(dp).format(0, 0)}**
Total Cost: **${numeral(cost).format(0, 0)}**
			
Required OP to Slaughter: **${numeral(dieOP).format(0, 0)}**
DP that can be slaughered: **${numeral(killDP).format(0, 0)}**`;

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`${interaction.user.username} - Army Power`)
      .setDescription(embedContent);
    return interaction.reply({ embeds: [embed] });
  },
};
