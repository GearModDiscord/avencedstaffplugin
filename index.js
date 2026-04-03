const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const express = require("express");
const fs = require("fs");
const crypto = require("crypto");

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const APP_URL = process.env.APP_URL || "https://myxoteirtest-production.up.railway.app";

const app = express();
app.use(express.json());

// Load existing licenses
let licenses = {};
if (fs.existsSync("licenses.json")) {
    licenses = JSON.parse(fs.readFileSync("licenses.json"));
}

// Save licenses
function saveLicenses() {
    fs.writeFileSync("licenses.json", JSON.stringify(licenses, null, 2));
}

// Generate random license key
function generateKey() {
    return crypto.randomBytes(8).toString("hex").toUpperCase();
}

/* ----------------- LICENSE VERIFY ENDPOINT ----------------- */
app.get("/verify", (req, res) => {
    const key = req.query.key;
    const hwid = req.query.hwid || "default-hwid";

    if (!licenses[key]) return res.send("INVALID");

    if (!licenses[key].hwid) {
        licenses[key].hwid = hwid;
        saveLicenses();
    }

    if (licenses[key].hwid !== hwid) return res.send("INVALID");

    res.send(`VALID ✅ License for ${licenses[key].owner}`);
});

// Start Express server
app.listen(process.env.PORT || 3000, () => {
    console.log("Express server running...");
});

/* ----------------- DISCORD BOT ----------------- */
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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

    if (interaction.commandName === "license" && interaction.options.getSubcommand() === "create") {
        const owner = interaction.options.getString("user");
        const key = generateKey();

        licenses[key] = { owner: owner, hwid: null };
        saveLicenses();

        const verifyLink = `${APP_URL}/verify?key=${key}&hwid=USER_HWID`;

        await interaction.reply(
            `✅ License created\n**Owner:** ${owner}\n**Key:** ${key}\n**Verify Here:** ${verifyLink}\n\n*Replace USER_HWID with your actual HWID if needed*`
        );
    }
});

client.login(TOKEN);
