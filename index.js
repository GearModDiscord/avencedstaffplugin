const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = process.env.TOKEN;
const FILE = "./licenses.json";

// Ensure licenses.json exists
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "{}");

client.once("ready", async () => {
    console.log("License bot ready!");

    const commands = [
        new SlashCommandBuilder()
            .setName("license-create")
            .setDescription("Create a new license")
            .addStringOption(opt => opt.setName("owner").setDescription("Owner name").setRequired(true)),

        new SlashCommandBuilder()
            .setName("license-revoke")
            .setDescription("Revoke a license key")
            .addStringOption(opt => opt.setName("key").setDescription("License key").setRequired(true)),

        new SlashCommandBuilder()
            .setName("license-info")
            .setDescription("Get info about a license")
            .addStringOption(opt => opt.setName("key").setDescription("License key").setRequired(true))
    ];

    try {
        await client.application.commands.set(commands);
        console.log("Slash commands registered!");
    } catch (err) {
        console.error("Failed to register slash commands:", err);
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    let licenses = JSON.parse(fs.readFileSync(FILE));

    try {
        switch (interaction.commandName) {

            case "license-create": {
                const owner = interaction.options.getString("owner");
                const key = generateKey(); // random key
                const hwid = "USER_HWID"; // placeholder, your plugin will replace this

                licenses[key] = {
                    owner,
                    hwid,
                    active: true,
                    createdAt: Date.now()
                };

                fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));

                await interaction.reply({
                    content:
`✅ New license created:
Owner: ${owner}
Key: ${key}
Verify Link: https://myxoteirtest-production.up.railway.app/verify?key=${key}&hwid=${hwid}`,
                    ephemeral: true
                });
                break;
            }

            case "license-revoke": {
                const key = interaction.options.getString("key");
                if (!licenses[key]) return interaction.reply({ content: `❌ License ${key} does not exist.`, ephemeral: true });
                licenses[key].active = false;
                fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));
                await interaction.reply({ content: `⛔ License ${key} has been revoked.`, ephemeral: true });
                break;
            }

            case "license-info": {
                const key = interaction.options.getString("key");
                if (!licenses[key]) return interaction.reply({ content: `❌ License ${key} does not exist.`, ephemeral: true });
                const info = licenses[key];
                await interaction.reply({
                    content:
`ℹ️ License info:
Owner: ${info.owner}
Key: ${key}
HWID: ${info.hwid}
Active: ${info.active}
Created At: ${new Date(info.createdAt).toLocaleString()}
Verify Link: https://myxoteirtest-production.up.railway.app/verify?key=${key}&hwid=${info.hwid}`,
                    ephemeral: true
                });
                break;
            }

        }
    } catch (err) {
        console.error(err);
        if (!interaction.replied) await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
    }
});

// Function to generate random license key
function generateKey() {
    return [...Array(16)]
        .map(() => Math.floor(Math.random() * 16).toString(16).toUpperCase())
        .join('');
}

client.login(TOKEN);
