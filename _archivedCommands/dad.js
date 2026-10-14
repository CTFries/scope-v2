const { SlashCommandBuilder } = require("@discordjs/builders");
const got = require('got');

const fallbackJokes = [
  "I'm reading a book about anti-gravity. It's impossible to put down!",
  "Why don't scientists trust atoms? Because they make up everything!",
  "I used to hate facial hair, but then it grew on me.",
  "What do you call a fake noodle? An impasta!",
];

module.exports = {
  data: new SlashCommandBuilder().setName("dad").setDescription("jokes"),
  async execute(interaction) {
    try {
      const data = await got.get('https://icanhazdadjoke.com/', { timeout: { request: 5000 } }).json();
      return await interaction.reply(data.joke);
    } catch (error) {
      const fallback = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
      return await interaction.reply(fallback);
    }
  },
};