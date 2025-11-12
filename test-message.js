require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Create a temporary client just for testing
const testClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
});

async function sendManualMessage(customMessage = 'sorry for spam, i sleep now') {
    try {
        console.log('Logging in to Discord...');
        await testClient.login(process.env.DISCORD_BOT_TOKEN);
        
        console.log('Fetching channel...');
        const channel = await testClient.channels.fetch(process.env.CHANNEL_ID);
        console.log('Channel found:', channel.name, 'Type:', channel.type);
        
        console.log('Sending message...');
        const message = await channel.send(customMessage);
        console.log('Message sent successfully!', message ? 'Message ID: ' + message.id : 'No message object returned');
        
        await testClient.destroy();
        return true;
    } catch (error) {
        console.error('Error sending test message:', error);
        await testClient.destroy();
        return false;
    }
}

// Run the test
sendManualMessage();