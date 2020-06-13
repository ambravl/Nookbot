// eslint-disable-next-line no-unused-vars
module.exports = (client, event, shardID) => {
  // The bot won't attempt to login again, so attempt to login again
  console.error('Bot Disconnected! Attempting to reconnect!');
  client.login(client.token).catch(() => {
    const interval = setInterval(() => {
      client.login(client.token).then(clearInterval(interval));
    }, 5000);
  });
};
