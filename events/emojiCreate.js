module.exports = async (client, emoji) => {
  client.emojiDB.insert(emoji.id, 0);
};
