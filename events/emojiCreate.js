module.exports = async (client, emoji) => {
  client.emoji.set(emoji.id, 0);
};
