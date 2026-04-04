const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = process.env.TOKEN;
const FILE = "./licenses.json";

// Ensure licenses.json exists
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "{}");

client.once("ready", async () => {
    console.log("License bot ready!");

    // Register commands globally
    const commands = [
        new SlashCommandBuilder()
            .setName("license-create")
            .setDescription("Create a license key")
            .addStringOption(opt => opt.setName("key").setDescription("License key").setRequired(true))
            .addStringOption(opt => opt.setName("domain").setDescription("Server domain").setRequired(true)),

        new SlashCommandBuilder()
            .setName("license-revoke")
            .setDescription("Revoke a license key")
            .addStringOption(opt => opt.setName("key").setDescription("License key to revoke").setRequired(true)),

        new SlashCommandBuilder()
            .setName("license-update")
            .setDescription("Change the domain of a license")
            .addStringOption(opt => opt.setName("key").setDescription("License key to update").setRequired(true))
            .addStringOption(opt => opt.setName("domain").setDescription("New domain").setRequired(true)),

        new SlashCommandBuilder()
            .setName("license-info")
            .setDescription("Get info about a license")
            .addStringOption(opt => opt.setName("key").setDescription("License key to check").setRequired(true))
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

    const key = interaction.options.getString("key");

    try {
        switch (interaction.commandName) {
            case "license-create":
                const domain = interaction.options.getString("domain");
                licenses[key] = {
                    domain: domain.toLowerCase(),
                    createdBy: interaction.user.id,
                    createdAt: Date.now(),
                    active: true
                };
                fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));
                await interaction.reply({ content: `✅ License **${key}** created for domain **${domain}**`, ephemeral: true });
                break;

            case "license-revoke":
                if (!licenses[key]) return interaction.reply({ content: `❌ License **${key}** does not exist.`, ephemeral: true });
                licenses[key].active = false;
                fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));
                await interaction.reply({ content: `⛔ License **${key}** has been revoked.`, ephemeral: true });
                break;

            case "license-update":
                const newDomain = interaction.options.getString("domain");
                if (!licenses[key]) return interaction.reply({ content: `❌ License **${key}** does not exist.`, ephemeral: true });
                licenses[key].domain = newDomain.toLowerCase();
                fs.writeFileSync(FILE, JSON.stringify(licenses, null, 2));
                await interaction.reply({ content: `🔄 License **${key}** updated to domain **${newDomain}**`, ephemeral: true });
                break;

            case "license-info":
                if (!licenses[key]) return interaction.reply({ content: `❌ License **${key}** does not exist.`, ephemeral: true });
                const info = licenses[key];
                await interaction.reply({
                    content: `ℹ️ License **${key}** info:\n- Domain: ${info.domain}\n- Active: ${info.active}\n- Created by: <@${info.createdBy}>\n- Created at: ${new Date(info.createdAt).toLocaleString()}`,
                    ephemeral: true
                });
                break;
        }
    } catch (err) {
        console.error(err);
        if (!interaction.replied) await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
    }
});

client.login(TOKEN);
