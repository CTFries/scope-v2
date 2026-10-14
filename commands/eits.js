const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { e } = require('mathjs');
const numeral = require('numeral');
const races = require('../resources/units');
const { fetchPreviousMessage } = require('../helpers');
function raceIdentify(i) {
	const words = i.toString();
	if (words.search('Catapults') > 0) {
		return 'human';
	}
	else if (words.search('Archmages') > 0) {
		return 'elf';
	}
	else if (words.search('Nazgul') > 0) {
		return 'orc';
	}
	else if (words.search('Cavemasters') > 0) {
		return 'dwarf';
	}
	else if (words.search('Berserkers') > 0) {
		return 'troll';
	}
	else if (words.search('Adventurers') > 0) {
		return 'halfling';
	}
	else {
		return 'Error';
	}
}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('eits')
		.setDescription('Calculates the OP/DP of EITS results, must paste the results THEN immediately call the bot')
		
		.addIntegerOption(option =>
			option.setName('military')
				.setDescription('The military science level of the target')
				.setRequired(true)
				.addChoice('0', 0)
				.addChoice('1', 1)
				.addChoice('2', 2)
				.addChoice('3', 3)
				.addChoice('4', 4)
				.addChoice('5', 5)
				.addChoice('6', 6)
				.addChoice('7', 7)
				.addChoice('8', 8)
				.addChoice('9', 9)
				.addChoice('10', 10),
		).addIntegerOption(option =>
			option.setName('magic')
				.setDescription('Required for AM calcs')
				.setRequired(true)
				.addChoice('0', 0)
				.addChoice('1', 1)
				.addChoice('2', 2)
				.addChoice('3', 3)
				.addChoice('4', 4)
				.addChoice('5', 5)
				.addChoice('6', 6)
				.addChoice('7', 7)
				.addChoice('8', 8)
				.addChoice('9', 9)
				.addChoice('10', 10),
		).addIntegerOption(option =>
			option.setName('visible')
				.setDescription('Show to all, or just you?')
				.setRequired(false)
				.addChoice('Just me', 1)
				.addChoice('Everyone', 0),
        ),
	async execute(interaction) {
		const messageContent = await fetchPreviousMessage(interaction);
		const userChoice = interaction.options.getInteger('visible');

		if (!messageContent) {
			return interaction.reply({ content: "Could not find a message to parse. Please paste your EITS data first.", ephemeral: true });
		}

		// LOGIC STARTS HERE
		const races = require('../resources/units');
		let op = 0;
		let endCut = -5, startCut = -5;
		let dp = 0;
		let cost = 0;
		const units = [];
		let rawUnits = 0;
		let GTs = 0;
		let MTs = 0;
		const military = interaction.options.getInteger('military') ? interaction.options.getInteger('military') : 0;
		const magic = interaction.options.getInteger('magic') ? interaction.options.getInteger('magic') : 0;
		let extraArmies = 0;
		let extraTroops = 0;
		let type = 'N/A';
		let intermNames = 'N/A';
		let owner = 'N/A';
		let target = 'N/A';
		let startTarget = 'N/A';
		let endTarget = 'N/A';
		let startOwner = 'N/A';
		let endOwner = 'N/A';
		let walls = 0;
		let argArray = messageContent.toString().replace(/[^\x00-\x7F]/g, "").split('\n').toString().split(',');

		// Determine starting and ending cuts
		// Security: Limit array iteration to prevent resource exhaustion from very long messages
		const maxIterations = Math.min(argArray.length, 10000);
		for (let i = 0; i < maxIterations; i++) {
			if (argArray[i] === 'When' && argArray[i + 1] === 'casting' && argArray[i + 2] === 'the') {
				endCut = i - 1;
			}
			if (argArray[i] === 'Through' && argArray[i + 1] === 'the' && argArray[i + 2] === 'eye') {
				startCut = i;
			}
		}
		// if no cut is detected, default to starting and ending locations
		if (startCut === -5) {
			startCut = 0;
		}
		if (endCut === -5) {
			endCut = argArray.length;
		}
		// parse input data according to above
		argArray = argArray.slice(startCut, endCut);

		// Army EITS Reports
		if (argArray.length < 15) {
			// city === false, army === true
			type = false;
			intermNames = argArray.splice(0,1).toString().split('from');
			owner = intermNames[1];
			target = intermNames[0];
			rawUnits = argArray.slice(argArray.length - 6, argArray.length).toString().replace('Pony,riders', 'Pony riders').toString().split(':').toString().split(',');
			rawNames = argArray.slice(0, argArray.length - 6).toString().replace(':', ',').split(',');
		}

		// City EITS reports
		else {
		// city === true, army === false
			type = true;
			argArray = argArray.toString().replace(':', ',').replaceAll(' ', ',').split(',');
			startTarget = argArray.indexOf('about');
			endTarget = argArray.indexOf('');
			target = argArray.slice(startTarget + 1, endTarget).join(' ');
			startOwner = argArray.indexOf('by');
			endOwner = argArray.indexOf('', startOwner);
			owner = argArray.slice(startOwner + 1, endOwner).join(' ');
			rawUnits = argArray.slice(endOwner + 1, endOwner + 8).toString().replace('Pony,riders', 'Pony riders').toString().split(':').toString().split(',');
			GTs = argArray.slice(endOwner + 14, endOwner + 16).toString().replace('Guard,Towers:', 'Guard Towers:').split(':')[1];
			MTs = argArray.slice(endOwner + 12, endOwner + 14).toString().replace('Magic,Towers:', 'Magic Towers:').split(':')[1];
			walls = argArray.slice(endOwner + 21, endOwner + 22).toString().split(':')[1];
			extraArmies = argArray.slice(argArray.indexOf('city:') + 1, argArray.indexOf('city:') + 2).toString().split('(')[0];
			extraTroops = argArray.slice(argArray.indexOf('men)') - 1, argArray.indexOf('men)'));
			rawUnits.push('GTs', GTs);
		}

		for (i = 0; i < (rawUnits.length / 2); i++) {
			units[i] = rawUnits[(i * 2) + 1];
		}
		// Identifies Race
		const raceName = raceIdentify(rawUnits);
		const race = races[raceName];
		// Handles elf mess
		if (raceName === 'elf') {
			const mag = magic > 9 ? 9 : magic;
			race.u5.op = mag * 3;
			race.u5.dp = mag * 3;
		}

		let movementTroopCount = 0;

		if(raceName !== 'dwarf'){
			movementTroopCount = units[0] + units[1] + (units[2]*2) + units[3] + (units[4]*2) + units[5];
		}
		else{
			movementTroopCount = units[0] + units[1] + units[2] + units[3] + units[4] + units[5];
		}

		let moveSpeed = 0;

		if(movementTroopCount > 179870){
			moveSpeed = 3;
		}
		else if(movementTroopCount > 7630){
			moveSpeed = 2;
		}
		else if(movementTroopCount > 322){
			moveSpeed = 1.5;
		}
		else if(movementTroopCount > 12){
			moveSpeed = 1.2;
		}
		else{
			moveSpeed = 1;
		}

		// calculates Raw Unit OP/DP & Cost
		for (i = 1; i < 8; i++) {
			const unitI = 'u'.concat(i);
			if (i < 7) {
				// units are base 0, so subtract 1
				op = isNaN(units[i - 1]) ? op : op + units[i - 1] * race[unitI].op;
				dp = isNaN(units[i - 1]) ? dp : dp + units[i - 1] * race[unitI].dp;
				cost = isNaN(units[i - 1]) ? cost : cost + units[i - 1] * race[unitI].cost;
			}
		}
		op = military ? op * (1 + military / 10) : op;
		dp = military ? dp * (1 + military / 10) : dp;
		dp = units[6] > 0 ? dp + units[6] * (5 + parseInt(military, 10)) : dp; // likewise, 6 would be GTs now, not 7


		// LOGIC ENDS HERE

		const embedContent = `Calculation Requested by: ${interaction.user.username}
**Target ${type ? 'City' : 'Army'}:**
${target}
**Owner:**
${owner}

**Units:**
${race.u1.name}: ${numeral(units[0]).format('0,0')}
${race.u2.name}: ${numeral(units[1]).format('0,0')}
${race.u3.name}: ${numeral(units[2]).format('0,0')}
${race.u4.name}: ${numeral(units[3]).format('0,0')}
${race.u5.name}: ${numeral(units[4]).format('0,0')}
${race.u6.name}: ${numeral(units[5]).format('0,0')}
${type ? `
**Buildings:**
${race.u7.name}: ${numeral(units[6]).format('0,0')}
Magic Towers: ${numeral(MTs).format('0,0')}
Extra Armies: ${numeral(extraArmies).format('0')}
Extra Troops: ${numeral(extraTroops).format('0,0')}
Walls: ${numeral(walls).format('0,0')}\n` : ''}
**Power:**
Military Sci: ${military}
Magic Sci: ${magic}
Cost: ${numeral(cost).format('0,0')}
OP: ${numeral(op).format('0,0')}
DP: ${numeral(dp).format('0,0')}
${type ? '' : `Movement: ${numeral(moveSpeed).format('0')}
*^ Multiply by Scout Ticks for army speed*`}

OP for 100%: ${numeral(3 * dp).format('0,0')}
OP for 15%: ${numeral(0.7 * dp).format('0,0')}
^ *For AotD-chain*
		
credit:
made with :heart: by Percy & Moff`;

		const embed = new MessageEmbed()
			.setColor(2123412)
			.setTitle(`${target} - Eye in the Sky`)
			.setDescription(embedContent)
			.setTimestamp();
		return await interaction.reply({ embeds: [ embed ], ephemeral: userChoice });
	},
};
