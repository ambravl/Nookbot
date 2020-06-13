module.exports = async (client, emoji) => {
  client.emoji.delete(emoji.id);
};
