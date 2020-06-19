module.exports = (client) => {
  const fs = require('fs');
  const Enmap = require('enmap');

  client.commands = new Enmap();
  client.aliases = new Enmap();

  fs.readdir('./commands/', (err, folders) => {
    if (err) {
      return console.error(err);
    }

    // Looping over all folders to load all commands
    for (let i = 0; i < folders.length; i++) {
      fs.readdir(`./commands/${folders[i]}/`, (error, files) => {
        if (error) {
          return console.error(error);
        }
        files.forEach((file) => {
          const props = require(`../commands/${folders[i]}/${file}`);
          const commandName = props.help.name;
          if (!file.endsWith('.js')) {
            return;
          }

          console.log(`Attempting to load command ${commandName}`);

          client["enabledCommands"].ensure(commandName, 't')
            .then((res) => {
              if (res === 'f') {
                console.log('Aborted because the command is currently disabled');
                return;
              }
              client.commands.set(commandName, props);

              if (props.conf.aliases) {
                props.conf.aliases.forEach((alias) => {
                  client.aliases.set(alias, commandName);
                });
              }
            })
            .catch((err) => {
              throw err;
            })
        });
      });
    }
  });
};