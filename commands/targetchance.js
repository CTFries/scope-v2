const numeral = require("numeral");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log10 } = require("mathjs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("targetchance")
    .setDescription("OP to add to reach target % chance")
    .addIntegerOption((option) =>
      option.setName("op").setDescription("Your army's OP").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("targetchance").setDescription("Chance you want to have").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("dp").setDescription("Enemy army's DP").setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName("currentchance").setDescription("Current chance on army").setRequired(false)
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
    const entryDP = interaction.options.getInteger("dp") ? interaction.options.getInteger("dp") : -1;
    const targetChance = interaction.options.getInteger("targetchance");
    const currentChance = interaction.options.getInteger("currentchance") ? interaction.options.getInteger("currentchance") : -1;
    const userChoice = interaction.options.getInteger("visible");

    // If both enemy DP and current chance are unlisted, error out
    if(entryDP === -1 && currentChance === -1){
        return interaction.reply({
          content:
            "**Warning:** Must enter either target DP or current % chance.",
          ephemeral: true,
        });
    }

    if(targetChance < 1 || targetChance > 100){
        return interaction.reply({
            content:
              "**Warning:** Target % chance must be between 1% and 100%.",
            ephemeral: true,
          });
    }

    if((currentChance < 1 && entryDP === -1) || currentChance > 100){
        return interaction.reply({
            content:
              "**Warning:** Current % chance must be between 1 and 100%.",
            ephemeral: true,
          });
    }

    if(currentChance === 100){
        return interaction.reply({
            content:
              "**Warning:** Infinite solution, try chance between 1% and 99%",
            ephemeral: true,
          });
    }

    let curRatio = [];
    let curChance = [];
    let tarRatio = [];
    let needOP = [];
    let DP = [];

    if(currentChance !== -1){
        curChance = currentChance;
        curRatio = Math.pow((curChance/100) / (1 - (curChance/100)), 0.2);
        DP = OP / curRatio;
    }
    else{
        DP = entryDP
        curRatio = OP / DP;
        curChance = Math.round((1 - 1 / (1 + Math.pow(10, 5 * log10(curRatio)))) * 1000) / 10;
    }

    console.log(curChance);
    console.log(curRatio);
    console.log(OP);
    console.log(DP);

    tarRatio = Math.pow((targetChance/100) / (1 - (targetChance/100)), 0.2);
    needOP =  Math.round(DP * tarRatio) - OP;

    const embedContent = `Attacker (You) OP: *${numeral(OP).format('0,0')}*
Defender (Enemy) DP: *${numeral(DP).format('0,0')}*
OP/DP Ratio: *${Math.round(curRatio*100)/100}*
Current Chance: *${curChance}%*

Target Chance: *${targetChance}%*
Target Ratio: *${Math.round(tarRatio*100)/100}*
**OP Needed: *${numeral(needOP).format('0,0')}***`;

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`${interaction.user.username} - Army vs Army Chances`)
      .setDescription(embedContent);
    return await interaction.reply({ embeds: [embed], ephemeral: userChoice });
  },
};
