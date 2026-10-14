/**
 * Discord bot helper utilities
 */

/**
 * Fetches the most recent message from the channel (before the command was sent)
 * Used by commands that parse pasted game data (attack, eits, reportError, etc.)
 *
 * @param {Interaction} interaction - The Discord interaction object
 * @param {number} maxLength - Maximum content length to return (default 2000 for DB storage)
 * @returns {Promise<string|null>} - The message content or null if not found
 */
async function fetchPreviousMessage(interaction, maxLength = 2000) {
  try {
    const channel = await interaction.channel.fetch();
    const messages = await channel.messages.fetch({ limit: 1 });
    const firstMessageId = messages.keys().next().value;

    if (!firstMessageId) {
      return null;
    }

    const messageContent = messages.get(firstMessageId)?.content;

    if (!messageContent) {
      return null;
    }

    // Store on interaction for logging, truncate to maxLength
    interaction.fetchedMessageContent = messageContent.substring(0, maxLength);

    return messageContent;
  } catch (error) {
    console.error('[HELPERS] Failed to fetch previous message:', error.message);
    return null;
  }
}

module.exports = {
  fetchPreviousMessage,
};
