const { SlashCommandBuilder } = require("@discordjs/builders");
const got = require("got");

const fallbackJokes = [
  "Yo mama so fat, when she steps on the scale it says 'To be continued...'",
  "Yo mama so old, her birth certificate is in Roman numerals.",
  "Yo mama so short, she hangs glides on a Dorito.",
  "Yo mama so slow, she took 2 hours to watch 60 Minutes.",
];

module.exports = {
  data: new SlashCommandBuilder().setName("mom").setDescription("jokes"),
  async execute(interaction) {
    try {
      const data = await got.get("https://yomama-jokes.com/api/random", { timeout: { request: 5000 } }).json();
      return await interaction.reply(data.joke);
    } catch (error) {
      const fallback = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
      return await interaction.reply(fallback);
    }
  },
};
