// bot.js
const express = require("express");
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const app = express();

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const FILE = "./licenses.json";

if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "{}");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Parse query params for /verify
app.get("/verify", (req, res) => {
    try {
        const key = req.query.key;
        const hwid = req.query.hwid;

        if (!key || !hwid) return res.status(400).send("Missing key or hwid");

        const licenses = JSON.parse(fs.readFileSync(FILE));

        if (licenses[key] && licenses[key].active && licenses[key].hwid === hwid) {
            return res.send("VALID");
        } else {
            return res.send("INVALID");
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
});

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
            .addStringOption(opt => opt.setName("key").setDescription("Key to revoke").setRequired(true)),

        new SlashCommandBuilder()
            .setName("license-info")
            .setDescription("Info about a license")
            .addStringOption(opt => opt.setName("key").setDescription("License key").setRequired(true))
    ];

    await client.application.commands.set(commands);
});

// Handle slash commands
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    let licenses = JSON.parse(fs.readFileSync(FILE));

    const key = interaction.options.getString("key");

    switch (interaction.commandName) {
        case "license-create": {
            const owner = interaction.options.getString("owner");
            const newKey = generateKey();
            const hwid = "PLACEHOLDER_HWID"; // can be set later per server
            licenses[newKey] = { owner, hwid, active: true, createdAt: Date.now() };
            fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));
            await interaction.reply({ content:
`✅ New license created:
Owner: ${owner}
Key: ${newKey}
Verify Link: https://myxoteirtest-production.up.railway.app/verify?key=${newKey}&hwid=${hwid}`, ephemeral: true });
            break;
        }
        case "license-revoke":
            if (!licenses[key]) return interaction.reply({ content: "License not found", ephemeral: true });
            licenses[key].active = false;
            fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));
            await interaction.reply({ content: `License ${key} revoked`, ephemeral: true });
            break;
        case "license-info":
            if (!licenses[key]) return interaction.reply({ content: "License not found", ephemeral: true });
            const info = licenses[key];
            await interaction.reply({ content:
`ℹ️ License info:
Owner: ${info.owner}
Key: ${key}
HWID: ${info.hwid}
Active: ${info.active}
Created: ${new Date(info.createdAt).toLocaleString()}
Verify Link: https://myxoteirtest-production.up.railway.app/verify?key=${key}&hwid=${info.hwid}`, ephemeral: true });
            break;
    }
});

function generateKey() {
    return [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
}

// Start Express server
app.listen(PORT, () => console.log(`License server running on port ${PORT}`));
client.login(TOKEN);
