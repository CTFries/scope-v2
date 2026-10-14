const numeral = require("numeral");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log10 } = require("mathjs");
const { SECURITY_LIMITS, safeTroops, safeCitySize, safeOPDP, logSecurityLimit } = require("../security");

function prep(troops, citySize) {
    // Security: Bound the result to prevent excessive loop iterations
    const result = Math.round((Math.pow(troops, 0.3) * citySize) / 12 + 3);
    return Math.min(result, SECURITY_LIMITS.MAX_PREP_ITERATIONS);
}

function defenseCalc(maxPrep, attackOP, defendDP, GTDP) {
    // Security: Ensure maxPrep is bounded
    const safeMaxPrep = Math.min(maxPrep, SECURITY_LIMITS.MAX_PREP_ITERATIONS);

    // Security: Avoid division by zero in ratio calculations
    const safeDefendDP = Math.max(defendDP, 1);
    const safeTotalDP = Math.max(defendDP + (GTDP || 0), 1);

    // Takeover and Siege OP/DP ratios (relative to attacker)
    const maxRatio = [attackOP/safeTotalDP, attackOP/safeDefendDP];

    // Takeover and Siege Max Chance values
    // Security: Protect log10 from zero/negative values
    const maxChance = [
        Math.round(100*(1 - 1 / (1 + Math.pow(10, 5 * log10(Math.max(maxRatio[0], 0.001)))))),
        Math.round(100*(1 - 1 / (1 + Math.pow(10, 5 * log10(Math.max(maxRatio[1], 0.001))))))
    ];

    let TotAttackChance = [];
    let attackChance = [];
    let curRatio = [];

  // First iteration, full walls (double prep)
  // Security: Bound iteration count
  const maxIterWalls = Math.min(safeMaxPrep * 2, SECURITY_LIMITS.MAX_PREP_ITERATIONS);
  for (let j = 1; j <= maxIterWalls; j++) {
    // Iterate through Remaining Prep to find %Chance at each tick
    for (let i = 0; i <= 1; i++) {
      // OPDP based on current tick iteration
      // Security: Avoid division by zero
      curRatio = (maxRatio[i] * j) / Math.max(safeMaxPrep * 2, 1);

      // Add current chance value to array of values
      attackChance[i] = Math.round(
        100 * (1 - 1 / (1 + Math.pow(10, 5 * log10(Math.max(curRatio, 0.001)))))
      );
    }

    TotAttackChance.push([attackChance[0], attackChance[1]]);
  }

  let noWallChance = [];
  let TotNoWallChance = [];
  curRatio = [];

  // Second iteration, No Walls
  // Security: Bound iteration count
  for (let j = 1; j <= safeMaxPrep; j++) {
    // Iterate through Remaining Prep to find %Chance at each tick
    for (let i = 0; i <= 1; i++) {
      // OPDP based on current tick iteration
      // Security: Avoid division by zero
      curRatio = (maxRatio[i] * j) / Math.max(safeMaxPrep, 1);

      // Add current chance value to array of values
      noWallChance[i] = Math.round(
        100 * (1 - 1 / (1 + Math.pow(10, 5 * log10(Math.max(curRatio, 0.001)))))
      );

      // Print array of chance values
    }

    // Push each iteration into new row
    TotNoWallChance.push([noWallChance[0], noWallChance[1]]);
  }

    let AttackWalls = [];
    let SiegeWalls = [];
    let NoWallAttack = [];
    let NoWallSiege = [];

    // Break each Full Wall array into individual components
    // Security: Use bounded iteration
    for (let i = 0; i < maxIterWalls; i++) {
        AttackWalls.push(TotAttackChance[i] ? TotAttackChance[i][0] : " - ");
    }

    // Break each No Wall array into individual components
    for (let i = 0; i < safeMaxPrep; i++) {
        NoWallAttack.push(TotNoWallChance[i] ? TotNoWallChance[i][0] : " - ");
    }

    // Add '-' symbols for each tick after the No Wall max is reached
    for (let j = safeMaxPrep; j < maxIterWalls; j++) {
        NoWallAttack.push(" - ");
    }

    // Break each Full Wall array into individual components
    for (let i = 0; i < maxIterWalls; i++) {
      SiegeWalls.push(TotAttackChance[i] ? TotAttackChance[i][1] : " - ");
    }

    // Break each No Wall array into individual components
    for (let i = 0; i < safeMaxPrep; i++) {
      NoWallSiege.push(TotNoWallChance[i] ? TotNoWallChance[i][1] : " - ");
    }

    // Add '-' symbols for each tick after the No Wall max is reached
    for (let j = safeMaxPrep; j < maxIterWalls; j++) {
      NoWallSiege.push(" - ");
    }

  var combine = [];

  // Combine all arrays into single table
  // Security: Use bounded iteration
  for (let i = 0; i < maxIterWalls; i++) {
    combine.push([
      AttackWalls[i],
      NoWallAttack[i],
      SiegeWalls[i],
      NoWallSiege[i],
    ]);
  }
  return [
    combine,
    AttackWalls,
    SiegeWalls,
    NoWallAttack,
    NoWallSiege,
    maxRatio,
    maxChance
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("defend")
    .setDescription("Provides inverse attack report")
    .addIntegerOption((option) =>
      option
        .setName("attacktroopcount")
        .setDescription("# Attacking Troops")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("citysize")
        .setDescription("Visual city size")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("attackop")
        .setDescription("OP of attacker")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("defenddp")
        .setDescription("DP of city (NO GTS)")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("gtdp")
        .setDescription("DP from GTs (NO TROOPS)")
        .setRequired(false)
    ),

  async execute(interaction) {

    const userChoice = interaction.options.getInteger("visible");

    // Security: Validate and bound all user inputs
    const rawTroops = interaction.options.getInteger("attacktroopcount");
    const rawCitySize = interaction.options.getInteger("citysize");
    const rawAttackOP = interaction.options.getInteger("attackop");
    const rawDefendDP = interaction.options.getInteger("defenddp");
    const rawGTDP = interaction.options.getInteger("gtdp");

    const troops = safeTroops(rawTroops);
    const citySize = safeCitySize(rawCitySize);
    const attackOP = safeOPDP(rawAttackOP);
    const defendDP = safeOPDP(rawDefendDP);
    const GTDP = safeOPDP(rawGTDP || 0);

    // Log if any values were clamped (potential attack attempt)
    if (rawTroops !== troops || rawCitySize !== citySize) {
      logSecurityLimit('defend.js', 'troops/citySize', `${rawTroops}/${rawCitySize}`, `${troops}/${citySize}`);
    }

    const maxPrep = prep(troops,citySize);

    const allVals = defenseCalc(maxPrep, attackOP, defendDP, GTDP);
    
    let ticks = allVals[0];
    let attack = allVals[1];
    let siege = allVals[2];
    let attackNW = allVals[3];
    let siegeNW = allVals[4];
    let maxRatio = allVals[5];
    let maxChance = allVals[6];

    let aVal = [];
    let sVal = [];
    let aValNW = [];
    let sValNW = [];
    let chances = [];

    console.log(attack)

    chances.push(
      `City Size: *${numeral(citySize).format("0")}*
Attacking Troops: *${numeral(troops).format("0,0").replace(",", ".")}*
Max Prep (no walls): *${numeral(maxPrep).format("0")}*
Max Prep (full walls): *${numeral(maxPrep*2).format("0")}*
Attacker OP: *${numeral(attackOP).format("0,0").replace(",", ".")}*
Defender DP: *${numeral(defendDP).format("0,0").replace(",", ".")}*
GuardTower DP: *${numeral(GTDP).format("0,0").replace(",", ".")}*

**Enemy chances** over the remaining ticks:`
    );

    chances.push(
      `\`\`\`-------------------------\nT  | A+W | A-W | S+W | S-W\n-------------------------\n`
    );
    for (i = 0; i < attack.length; i++) {
      aVal = attack[i];
      sVal = siege[i];
      aValNW = attackNW[i];
      sValNW = siegeNW[i];

      if (aVal >= 0) {
        aVal = `${numeral(attack[i]).format("00")}%`;
      }

      if (sVal >= 0) {
        sVal = `${numeral(siege[i]).format("00")}%`;
      }

      if (aValNW >= 0) {
        aValNW = `${numeral(attackNW[i]).format("00")}%`;
      }

      if (sValNW >= 0) {
        sValNW = `${numeral(siegeNW[i]).format("00")}%`;
      }

      chances.push(
        `${numeral(i+1).format("00")}` +
          " | " +
          aVal +
          " | " +
          aValNW +
          " | " +
          sVal +
          " | " +
          sValNW +
          "\n"
      );
    }
    chances.push(
      `\nA+W|A-W: Attack chance w or w/o walls\nS+W|S-W: Siege chance w or w/o walls`
    );
    chances.push(`\`\`\``);

    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`${interaction.user.username} - Inverse Prep Calculation`)
      .setDescription(
        chances.toString().replaceAll(",", "").replaceAll(".", ",")
      )
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], ephemeral: userChoice });
  },
};
