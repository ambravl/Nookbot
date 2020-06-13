module.exports = async (client, emoji) => {
  client.db.emoji.set(emoji.id, 0);
};
