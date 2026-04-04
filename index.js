const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = process.env.TOKEN;
const FILE = "./licenses.json";

// Ensure licenses.json exists
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "{}");

client.once("ready", async () => {
    console.log("License bot ready!");

    // Register slash command globally
    const command = new SlashCommandBuilder()
        .setName("license-create")
        .setDescription("Create a license key")
        .addStringOption(option =>
            option.setName("key")
                .setDescription("License key")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("domain")
                .setDescription("Server domain (play.server.net)")
                .setRequired(true)
        );

    try {
        await client.application.commands.set([command]);
        console.log("Slash command registered!");
    } catch (err) {
        console.error("Failed to register slash commands:", err);
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "license-create") {
        try {
            const key = interaction.options.getString("key");
            const domain = interaction.options.getString("domain");

            // Read licenses
            let licenses = JSON.parse(fs.readFileSync(FILE));

            // Add or overwrite license
            licenses[key] = {
                domain: domain.toLowerCase(),
                createdBy: interaction.user.id,
                createdAt: Date.now(),
                active: true
            };

            // Save
            fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));

            // Reply to Discord
            await interaction.reply({
                content: `✅ License created for domain: **${domain}**`,
                ephemeral: true
            });
        } catch (err) {
            console.error(err);
            if (!interaction.replied) {
                await interaction.reply({
                    content: "❌ Failed to create license.",
                    ephemeral: true
                });
            }
        }
    }
});

client.login(TOKEN);
