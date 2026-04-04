const {
 Client,
 GatewayIntentBits,
 SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");

const client = new Client({
 intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;

const FILE = "./licenses.json";


client.once("ready", async () => {

 console.log("License bot ready");

 const command = new SlashCommandBuilder()
  .setName("license-create")
  .setDescription("Create a license key")
  .addStringOption(opt =>
   opt.setName("key")
    .setDescription("License key")
    .setRequired(true)
  )
  .addStringOption(opt =>
   opt.setName("domain")
    .setDescription("Server domain (example: play.server.net)")
    .setRequired(true)
  );

 await client.application.commands.create(command);

});


client.on("interactionCreate", async interaction => {

 if (!interaction.isChatInputCommand()) return;

 if (interaction.commandName === "license-create") {

  const key =
   interaction.options.getString("key");

  const domain =
   interaction.options.getString("domain");

  let licenses =
   JSON.parse(
    fs.readFileSync(FILE)
   );

  licenses[key] = {

   domain: domain.toLowerCase(),
   createdBy: interaction.user.id,
   createdAt: Date.now(),
   active: true

  };

  fs.writeFileSync(
   FILE,
   JSON.stringify(licenses, null, 2)
  );

  interaction.reply(
   "License created for domain: " + domain
  );

 }

});


client.login(TOKEN);
