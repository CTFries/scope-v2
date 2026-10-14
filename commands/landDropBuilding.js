const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { SECURITY_LIMITS, safeString } = require("../security");

class CityPageExtractionError extends Error {
  constructor(errorMessage) {
    super("Failed to extract values from city page");
    this.embed = createErrorEmbed(`${errorMessage}
      \nPlease make sure you have copied the entire city page (show all).
      \nTip: Use select all on mobile or ctrl/cmd + a on pc/mac to copy the page.`);
  }
}

function extractBuildingsLeftToBuild(cityPage) {
  const extracted = cityPage.match(/space for\s*(\d+)\s*more buildings/);

  if (!extracted) {
    throw new CityPageExtractionError("Could not extract buildings left to build from city page");
  }

  return extracted ? parseInt(extracted[1], 10) : 0;
}

function extractBuildings(cityPage) {
  const buildingTypes = ["Homes", "Mines", "Lumbermills", "Farms", "Armories", "Guardtowers", "Magic Towers", "Taverne", "Warehouses"];
  const extractedBuilt = {};

  for (let i = 0; i < buildingTypes.length; i++) {
    const buildingType = buildingTypes[i];
    // Security: Use a more specific regex pattern to avoid catastrophic backtracking
    // Instead of [\s\S]*? (which can backtrack excessively), we look for the pattern
    // more directly by finding the building type and then looking for "Built:" within
    // a reasonable distance (1000 chars)
    const buildingIndex = cityPage.indexOf(buildingType);
    if (buildingIndex === -1) {
      throw new CityPageExtractionError(`Could not find ${buildingType} in city page..`);
    }

    // Extract a substring starting from the building name (limit to 1000 chars for safety)
    const searchArea = cityPage.substring(buildingIndex, buildingIndex + 1000);
    const builtMatch = searchArea.match(/Built:\s*(\d+)/);

    if (!builtMatch) {
      throw new CityPageExtractionError(`Could not extract ${buildingType} built count from city page..`);
    }

    extractedBuilt[buildingType] = parseInt(builtMatch[1], 10);
  }

  return extractedBuilt;
}

function calcualteHomesTarget(config, totalBuildings, builtHomes) {
  const homesRatio = calculateHomesRatio(config);
  return Math.ceil(totalBuildings * homesRatio) - builtHomes;
}

function calculateHomesRatio(config) {
  return config.race == "dwarf" && config.cityType === "mine" ? 17420 / 90000 : 1 / 6;
}

function calculateResourceBuildingTarget(config, resourceType, totalBuildings, builtResourceBuildings, surplusHomes) {
  const resourceRatio = calculateResourceRatio(config);

  if (config.cityType === resourceType) {
    let targetResourceBuildings = Math.floor(totalBuildings * resourceRatio) - builtResourceBuildings;
    
    if (surplusHomes > 0) {
      return totalBuildings - builtResourceBuildings - surplusHomes;
    }

    return targetResourceBuildings;
  }

  return 0;
}

function calculateResourceRatio(config) {
  return config.race == "dwarf" && config.cityType === "mine" ? 72580 / 90000 : 5 / 6;
}

function calculate(config) {
  const buildingsLeftToBuild = extractBuildingsLeftToBuild(config.cityPage);
  const builtBuildings = extractBuildings(config.cityPage);

  const builtResourceBuildings = builtBuildings["Mines"] + builtBuildings["Lumbermills"] + builtBuildings["Farms"] + builtBuildings["Armories"];
  const miscBuildings = builtBuildings["Guardtowers"] + builtBuildings["Magic Towers"] + builtBuildings["Taverne"] + builtBuildings["Warehouses"];
  const totalBuildingsMinusMisc = builtBuildings["Homes"] + builtResourceBuildings + buildingsLeftToBuild - config.leftoverBuildings;

  let targetHomes = calcualteHomesTarget(config, totalBuildingsMinusMisc, builtBuildings["Homes"]);
  let surplusHomes = 0;

  if (targetHomes < 0) {
    surplusHomes = builtBuildings["Homes"];
    targetHomes = 0;
  }

  const targetMines = calculateResourceBuildingTarget(config, "mine", totalBuildingsMinusMisc, builtResourceBuildings, surplusHomes);
  const targetLumbermills = calculateResourceBuildingTarget(config, "lumber", totalBuildingsMinusMisc, builtResourceBuildings, surplusHomes);
  const targetFarms = calculateResourceBuildingTarget(config, "farm", totalBuildingsMinusMisc, builtResourceBuildings, surplusHomes);
  const targetArmories = calculateResourceBuildingTarget(config, "arms", totalBuildingsMinusMisc, builtResourceBuildings, surplusHomes);

  const maxArmories = 7500;

  if (config.cityType === "arms" && targetArmories + builtBuildings["Armories"] > maxArmories) {
    const adjustedArms = maxArmories - builtBuildings["Armories"];
    const differenceFromTarget = targetArmories - adjustedArms;
    targetHomes += differenceFromTarget;

    targetArmories = adjustedArms;
  }

  return { 
    "totalBuildings": totalBuildingsMinusMisc + miscBuildings,
    "homes": targetHomes, 
    "mines": targetMines, 
    "lumbermills": targetLumbermills, 
    "farms": targetFarms, 
    "armories": targetArmories
  };
}

function createErrorEmbed(message) {
  return new MessageEmbed()
    .setColor('#FF0000')
    .setDescription(message);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dropbuildcalc")
    .setDescription(
      "Calculate the number of buildings to do for standard single resource/armory land drops"
    )
    .addStringOption((option) =>
      option
        .setName("race")
        .setDescription("Race (human, elf, halfling, dwarf, orc, troll)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("citytype")
        .setDescription("City type (mine, farm, lumber, arms)")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("leftoverbuildings")
        .setDescription("Buildings leftover after drop (for other buildings like MT, GT, etc)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("citypage")
        .setDescription("City page (copy paste all of city page)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const validRaces = ["human", "elf", "halfling", "dwarf", "orc", "troll"];
    const race = interaction.options.getString("race").toLowerCase();

    if (!validRaces.includes(race)) {
      const embed = createErrorEmbed('Please select a valid race (e.g, human, elf, halfling, dwarf, orc, troll)');
      return await interaction.reply({ embeds: [embed] });
    }

    const validCityTypes = ["mine", "farm", "lumber", "arms"];
    const cityType = interaction.options.getString("citytype").toLowerCase();

    if (!validCityTypes.includes(cityType)) {
      const embed = createErrorEmbed('Please select a valid city type (e.g, mine, farm, lumber, arms)');
      return await interaction.reply({ embeds: [embed] });
    }

    const leftoverBuildings = interaction.options.getInteger("leftoverbuildings");

    if (leftoverBuildings < 0) {
      const embed = createErrorEmbed('Please enter a valid non-negative number of leftover buildings');
      return await interaction.reply({ embeds: [embed] });
    }

    const rawCityPage = interaction.options.getString("citypage");

    // Security: Limit city page length to prevent resource exhaustion
    const cityPage = safeString(rawCityPage, SECURITY_LIMITS.MAX_CITY_PAGE_LENGTH);

    const config = {
      race: race,
      cityType: cityType,
      leftoverBuildings: leftoverBuildings,
      cityPage: cityPage
    };

    let result;

    try {
      result = calculate(config);
    }
    catch (error) {
      return await interaction.reply({ embeds: [error.embed] });
    }

    let embedContent = 
`You have ${config.leftoverBuildings} buildings left over after your drop.\n
**You should build the following:** \n
\`\`\`Homes: ${result.homes}
Mines: ${result.mines}
Lumbermills: ${result.lumbermills}
Farms: ${result.farms}
Armories: ${result.armories}\`\`\``;
    
    const embed = new MessageEmbed()
      .setColor(2123412)
      .setTitle(`Land dropping to ${result.totalBuildings} buildings - ${interaction.user.username}`)
      .setDescription(embedContent)
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  },
};
