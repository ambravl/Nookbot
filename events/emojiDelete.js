module.exports = async (client, emoji) => {
  client.db.emoji.delete(emoji.id);
};
