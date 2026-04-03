const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const express = require("express");
const fs = require("fs");
const crypto = require("crypto");

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const APP_URL = process.env.APP_URL || "https://myxoteirtest-production.up.railway.app"; // Add your Railway app URL here

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
LICENSE VERIFY ENDPOINT
*/
app.get("/verify", (req, res) => {
    const key = req.query.key;
    const hwid = req.query.hwid;

    if (!licenses[key]) return res.send("INVALID");

    if (!licenses[key].hwid) {
        licenses[key].hwid = hwid;
        saveLicenses();
    }

    if (licenses[key].hwid !== hwid) {
        return res.send("INVALID");
    }

    res.send("VALID");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Express server running...");
});

/*
DISCORD BOT
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
                            .setDescription("Buyer username")
                            .setRequired(true)
                    )
            )
    ];

    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
        console.log("Guild not found");
        return;
    }

    await guild.commands.set(commands);
    console.log("Slash commands registered");
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "license") {
        if (interaction.options.getSubcommand() === "create") {
            const owner = interaction.options.getString("user");
            const key = generateKey();

            licenses[key] = {
                owner: owner,
                hwid: null
            };

            saveLicenses();

            const verifyLink = `${APP_URL}/verify?key=${key}&hwid=YOUR_HWID_HERE`;
            // Note: "YOUR_HWID_HERE" should be replaced with actual HWID when the user verifies

            await interaction.reply(
                `✅ License created\nOwner: ${owner}\nKey: ${key}\nVerify here: ${verifyLink}`
            );
        }
    }
});

client.login(TOKEN);
