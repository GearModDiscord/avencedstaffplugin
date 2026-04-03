
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const express = require("express");
const fs = require("fs");
const crypto = require("crypto");

const TOKEN = process.env.BOT_TOKEN;

const app = express();
app.use(express.json());

let licenses = {};

if (fs.existsSync("licenses.json")) {
  licenses = JSON.parse(fs.readFileSync("licenses.json"));
}

function saveLicenses() {
  fs.writeFileSync("licenses.json", JSON.stringify(licenses, null, 2));
}

function generateKey() {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}


/*
VERIFY ENDPOINT FOR MINECRAFT PLUGIN
*/

app.get("/verify", (req, res) => {

  const key = req.query.key;
  const hwid = req.query.hwid;

  if (!licenses[key]) return res.send("INVALID");

  if (!licenses[key].hwid)
    licenses[key].hwid = hwid;

  if (licenses[key].hwid !== hwid)
    return res.send("INVALID");

  res.send("VALID");

});


app.listen(process.env.PORT || 3000);


/*
DISCORD BOT SECTION
*/

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});


client.once("ready", async () => {

  console.log("License bot online");

  const commands = [

    new SlashCommandBuilder()
      .setName("license")
      .setDescription("License manager")
      .addSubcommand(sub =>
        sub
          .setName("create")
          .setDescription("Create license")
          .addStringOption(opt =>
            opt.setName("user")
              .setDescription("Owner name")
              .setRequired(true)
          )
      )

  ];

  await client.application.commands.set(commands);

});


client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "license") {

    if (interaction.options.getSubcommand() === "create") {

      const owner = interaction.options.getString("user");

      const key = generateKey();

      licenses[key] = {
        owner,
        hwid: null
      };

      saveLicenses();

      await interaction.reply(
        `✅ License created\nOwner: ${owner}\nKey: ${key}`
      );

    }

  }

});


client.login(TOKEN);
