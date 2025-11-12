require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('partiful')
        .setDescription('Create a Discord event from a Partiful event link')
        .addStringOption(option =>
            option
                .setName('link')
                .setDescription('Partiful event URL (https://partiful.com/e/...)')
                .setRequired(true)
        )
        .toJSON(),
];

async function main() {
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (!token || !clientId || !guildId) {
        console.error('Missing required env vars: DISCORD_BOT_TOKEN (or DISCORD_TOKEN), CLIENT_ID, GUILD_ID');
        process.exit(1);
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Deploying application (guild) commands...');
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        console.log('Successfully reloaded application (guild) commands.');
    } catch (error) {
        console.error('Error deploying commands:', error);
        process.exit(1);
    }
}

main();



