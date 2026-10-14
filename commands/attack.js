const numeral = require("numeral");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log10 } = require("mathjs");
const { SECURITY_LIMITS, safePrep, safeInteger, logSecurityLimit } = require("../security");
const { fetchPreviousMessage } = require("../helpers");

function nthIndex(str, pat, n) {
  // Security: limit iterations to prevent infinite loops
  const maxIterations = Math.min(n, 1000);
  let L = str.length;
  let i = -1;
  let iterations = maxIterations;
  while (iterations-- > 0 && i++ < L) {
    i = str.indexOf(pat, i);
    if (i < 0) break;
  }
  return i;
}

function battlecalc(string) {
  let armyNameStop = 0,
    wallLoc1 = 0,
    wallLoc2 = 0,
    cutOne = 0,
    defOne = 0,
    armor = 0,
    defTwo = 0,
    guard = 0,
    cutTwo = 0,
    attackOdds = 0,
    scienceTag = 0,
    SiegeYN = "No",
    Bless = "No",
    siegeOdds = 0,
    wallsAdd = 0,
    wallsCount = 0,
    currentPrep = 0,
    remainingPrep = 0,
    currentSoldiers = 0,
    currentTowers = 0,
    currentPez = 0,
    TargetName = "TargetName",
    ArmyName = "YourArmy",
    ownTroops = "NoneListed";
  let tempString = string
    .toString()
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\r?\n|\r/g, ",")
    .replace(",,", ",")
    .split(",")
    .toString()
    .replace(/,,/g, ",")
    .split(",")
    .toString()
    .split("...")
    .toString()
    .split(",")
    .join(" ")
    .split(" ");

  armyNameStop = tempString.indexOf("with");
  ArmyName = tempString.slice(0, armyNameStop).join(" ");

  ownTroops = tempString.slice(armyNameStop + 1, armyNameStop + 2);

  cutOne = nthIndex(tempString, "", 2);
  defOne = nthIndex(tempString, "defended", 1);
  armor = tempString.indexOf("armor.");
  defTwo = nthIndex(tempString, "defended", 2);
  guard = tempString.indexOf("guard");
  goodStuff = tempString.indexOf("currently");
  cutTwo = nthIndex(tempString, "prepared", 1);

  TargetName = tempString.slice(cutOne + 1, defOne - 1).join(" ");
  currentSoldiers = tempString.slice(defOne + 2, defOne + 3);
  currentPez = tempString.slice(defTwo + 2, defTwo + 3);
  currentTowers = tempString.slice(guard - 1, guard);

  if (tempString.includes("blessed!")) {
    Bless = "Yes";
  }

  if (tempString.includes("any")) {
    attackOdds = tempString.slice(goodStuff + 3, goodStuff + 4);
    siegeOdds = attackOdds;
  } else {
    attackOdds = tempString.slice(goodStuff + 3, goodStuff + 4);
    siegeOdds = tempString.slice(goodStuff + 10, goodStuff + 11);
  }

  if (tempString.includes("preparation")) {
    wallLoc1 = tempString.indexOf("preparation");
    wallsAdd = tempString.slice(wallLoc1 + 3, wallLoc1 + 4);
  }
  if (tempString.includes("walls")) {
    wallLoc2 = tempString.indexOf("walls");
    wallsCount = tempString.slice(wallLoc2 - 1, wallLoc2);
  }

  if (tempString.includes("siege.")) {
    SiegeYN = "Yes";
    siegeOdds = "100%";
  }

  currentPrep = tempString.slice(cutTwo + 1, cutTwo + 2);
  remainingPrep = tempString.slice(cutTwo + 10, cutTwo + 11);

  let tempTag = 0,
    milLevel = 0,
    WallPrep = 0,
    CurPrep = 0,
    RemPrep = 0,
    CurAttack = 0,
    CurSiege = 0;
  // Security: validate all parsed values with safe bounds and radix
  WallPrep = safePrep(parseInt(wallsAdd.toString(), 10));
  CurPrep = safePrep(parseInt(currentPrep.toString(), 10));
  RemPrep = safePrep(parseInt(remainingPrep.toString(), 10));
  CurAttack = safeInteger(parseInt(attackOdds.toString().split("%")[0], 10), 0, 100, 0);
  CurSiege = safeInteger(parseInt(siegeOdds.toString().split("%")[0], 10), 0, 100, 0);

  scienceTag = tempString.slice(armor - 5, armor).join(" ");
  tempTag = scienceTag.split(" ");
  milLevel = 0;
  if (tempTag.includes("mithril") > 0) {
    milLevel = "5+";
  } else if (tempTag.includes("sticks") > 0) {
    milLevel = "0";
  } else if (tempTag.includes("tree") > 0) {
    milLevel = "1";
  } else if (tempTag.includes("strong") > 0) {
    milLevel = "3";
  } else if (tempTag.includes("dwarven") > 0) {
    milLevel = "4";
  } else {
    milLevel = "2";
  }

  // Prep remaining both with and without walls
  // Security: Prep values already validated via safePrep above
  let Prep = [];
  let PrepAdvance = 0;

  if (RemPrep - WallPrep <= 0) {
    Prep = [RemPrep, 0];
    PrepAdvance = RemPrep;
  } else {
    Prep = [RemPrep, RemPrep - WallPrep];
    PrepAdvance = WallPrep;
  }

  // Security: Log if prep values were very high (potential attack attempt)
  if (Prep[0] > 100 || Prep[1] > 100) {
    logSecurityLimit('attack.js/battlecalc', 'Prep', Math.max(Prep[0], Prep[1]), SECURITY_LIMITS.MAX_PREP_ITERATIONS);
  }

  // Convert Attack (0) and Siege (1) percent chance to decimal chance
  const startChance = [CurAttack / 100, CurSiege / 100];

  // Initialize common variables and arrays
  let startOPDP = [],
    maxOPDP = [];

  // Security: Ensure CurPrep is at least 1 to avoid division by zero
  const safeCurPrep = Math.max(CurPrep, 1);

  let i = 0;
  for (i = 0; i <= 1; i++) {
    // Security: Avoid division by zero when startChance is 1
    const denominator = Math.max(1 - startChance[i], 0.001);
    startOPDP[i] = Math.pow(startChance[i] / denominator, 0.2);
    maxOPDP[i] = (startOPDP[i] / safeCurPrep) * (safeCurPrep + Prep[0]);
  }

  let attackChance = [];
  let TotAttackChance = [];
  TotAttackChance.push([CurAttack, CurSiege]);
  let OPDP = 0;

  // First iteration, full walls
  // Security: Prep[0] is already bounded by safePrep (max 200)
  const maxIter0 = Math.min(Prep[0], SECURITY_LIMITS.MAX_PREP_ITERATIONS);
  for (let j = 1; j <= maxIter0; j++) {
    // Iterate through Remaining Prep to find %Chance at each tick
    for (let i = 0; i <= 1; i++) {
      // OPDP based on current tick iteration
      // Security: Avoid division by zero
      const divisor = Math.max(Prep[0] + safeCurPrep, 1);
      OPDP = (maxOPDP[i] * (safeCurPrep + j)) / divisor;

      // Add current chance value to array of values
      attackChance[i] = Math.round(
        100 * (1 - 1 / (1 + Math.pow(10, 5 * log10(Math.max(OPDP, 0.001)))))
      );
    }

    TotAttackChance.push([attackChance[0], attackChance[1]]);
  }

  let noWallChance = [];
  let TotNoWallChance = [];

  console.log(Prep);
  console.log(CurPrep);

  // Second iteration, No Walls
  // Security: Prep[1] is already bounded by safePrep (max 200)
  const maxIter1 = Math.min(Prep[1], SECURITY_LIMITS.MAX_PREP_ITERATIONS);
  for (let j = 0; j <= maxIter1; j++) {
    // Iterate through Remaining Prep to find %Chance at each tick
    for (let i = 0; i <= 1; i++) {
      // OPDP based on current tick iteration
      if (Prep[1] > 0) {
        // Security: Avoid division by zero
        const divisor = Math.max(Prep[1] + safeCurPrep, 1);
        OPDP = (maxOPDP[i] * (safeCurPrep + j)) / divisor;
      } else {
        OPDP = maxOPDP[i];
      }

      // Add current chance value to array of values
      noWallChance[i] = Math.round(
        100 * (1 - 1 / (1 + Math.pow(10, 5 * log10(Math.max(OPDP, 0.001)))))
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

  // Security: Use bounded maxIter values for all remaining loops
  if (CurAttack == 0) {
    // Break each Full Wall array into individual components
    for (let i = 0; i <= maxIter0; i++) {
      AttackWalls.push(" - ");
    }

    // Break each No Wall array into individual components
    for (let i = 0; i <= maxIter1; i++) {
      NoWallAttack.push(" - ");
    }

    // Add '-' symbols for each tick after the No Wall max is reached
    for (let j = maxIter1 + 1; j <= maxIter0; j++) {
      NoWallAttack.push(" - ");
    }
  } else {
    // Break each Full Wall array into individual components
    for (let i = 0; i <= maxIter0; i++) {
      AttackWalls.push(TotAttackChance[i] ? TotAttackChance[i][0] : " - ");
    }

    // Break each No Wall array into individual components
    for (let i = 0; i <= maxIter1; i++) {
      NoWallAttack.push(TotNoWallChance[i] ? TotNoWallChance[i][0] : " - ");
    }

    // Add '-' symbols for each tick after the No Wall max is reached
    for (let j = maxIter1 + 1; j <= maxIter0; j++) {
      NoWallAttack.push(" - ");
    }
  }

  if (CurSiege == 0 || SiegeYN == "Yes") {
    // Break each Full Wall array into individual components
    for (let i = 0; i <= maxIter0; i++) {
      SiegeWalls.push(" - ");
    }

    // Break each No Wall array into individual components
    for (let i = 0; i <= maxIter1; i++) {
      NoWallSiege.push(" - ");
    }

    // Add '-' symbols for each tick after the No Wall max is reached
    for (let j = maxIter1 + 1; j <= maxIter0; j++) {
      NoWallSiege.push(" - ");
    }
  } else {
    // Break each Full Wall array into individual components
    for (let i = 0; i <= maxIter0; i++) {
      SiegeWalls.push(TotAttackChance[i] ? TotAttackChance[i][1] : " - ");
    }

    // Break each No Wall array into individual components
    for (let i = 0; i <= maxIter1; i++) {
      NoWallSiege.push(TotNoWallChance[i] ? TotNoWallChance[i][1] : " - ");
    }

    // Add '-' symbols for each tick after the No Wall max is reached
    for (let j = maxIter1 + 1; j <= maxIter0; j++) {
      NoWallSiege.push(" - ");
    }
  }

  var combine = [];

  // Combine all arrays into single table
  // Security: Use bounded iteration
  for (let i = 0; i <= maxIter0; i++) {
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
    Prep,
    CurPrep,
    WallPrep,
    ArmyName,
    TargetName,
    wallsCount,
    ownTroops,
    currentTowers,
    currentSoldiers,
    currentPez,
    Bless,
    milLevel,
    SiegeYN,
  ];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("attack")
    .setDescription("Paste, post message, then call")
    .addIntegerOption((option) =>
      option
        .setName("visible")
        .setDescription("Show to all, or just you?")
        .setRequired(false)
        .addChoice("Just me", 1)
        .addChoice("Everyone", 0)
    ),

  async execute(interaction) {
    const messageContent = await fetchPreviousMessage(interaction);
    const userChoice = interaction.options.getInteger("visible");

    if (!messageContent) {
      return interaction.reply({ content: "Could not find a message to parse. Please paste your battle data first.", ephemeral: true });
    }

    const allVals = battlecalc(messageContent);
    let ticks = 0;
    let attack = 0;
    let siege = 0;
    let attackNW = 0;
    let siegeNW = 0;
    let prepRem = 0;
    let prep = 0;
    let wallPrep = 0;

    ticks = allVals[0];
    attack = allVals[1];
    siege = allVals[2];
    attackNW = allVals[3];
    siegeNW = allVals[4];
    prepRem = allVals[5];
    prep = allVals[6];
    wallPrep = allVals[7];
    ArmyName = allVals[8];
    TargetName = allVals[9];
    wallsCount = allVals[10];
    ownTroops = allVals[11];
    currentTowers = allVals[12];
    currentSoldiers = allVals[13];
    currentPez = allVals[14];
    bless = allVals[15];
    milLevel = allVals[16];
    SiegeYN = allVals[17];

    let aVal = 0;
    let sVal = 0;
    let aValNW = 0;
    let sValNW = 0;
    let chances = [];

    chances.push(
      `Attack Table Requested by: ${interaction.user.username}
**Attacking Army: *${ArmyName}***
Prepared: *${numeral(prep).format("0")}*
Remaining: *${numeral(prepRem[0]).format("0")}*
Wall Prep: *${numeral(wallPrep).format("0")}*
Troops: *${numeral(ownTroops).format("0,0").replace(",", ".")}*
**Target: *${TargetName}***
Military: *${milLevel}*
Bless: *${bless}*
Sieged: *${SiegeYN}*
Walls: *${numeral(wallsCount).format("0,0").replace(",", ".")}*
GTs: *${numeral(currentTowers).format("0,0").replace(",", ".")}*
Troops: *${numeral(currentSoldiers).format("0,0").replace(",", ".")}*
Pez: *${numeral(currentPez).format("0,0").replace(",", ".")}*
Chances over the remaining ticks:`
    );

    chances.push(
      `\`\`\`-------------------------\nT  | A+W | A-W | S+W | S-W\n-------------------------\n`
    );
    for (i = 0; i < attack.length; i++) {
      aVal = attack[i];
      sVal = siege[i];
      aValNW = attackNW[i];
      sValNW = siegeNW[i];

      if (aVal > 0) {
        aVal = `${numeral(attack[i]).format("00")}%`.substr(0, 3);
      }

      if (sVal > 0) {
        sVal = `${numeral(siege[i]).format("00")}%`.substr(0, 3);
      }

      if (aValNW > 0) {
        aValNW = `${numeral(attackNW[i]).format("00")}%`.substr(0, 3);
      }

      if (sValNW > 0) {
        sValNW = `${numeral(siegeNW[i]).format("00")}%`.substr(0, 3);
      }

      chances.push(
        `${numeral(i).format("00")}` +
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
      .setTitle(`${TargetName} - Prep Calculation`)
      .setDescription(
        chances.toString().replaceAll(",", "").replaceAll(".", ",")
      )
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], ephemeral: userChoice });
  },
};
