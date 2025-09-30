require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Schedule the message to be sent every day at 11:11 PM
    // The cron expression is: second (0) minute (11) hour (23) day-of-month (*) month (*) day-of-week (*)
    cron.schedule('0 11 23 * * *', () => {
        sendWishMessage();
    }, {
        timezone: 'America/Los_Angeles' // Change this to your timezone
    });
    
    console.log('Bot is running and scheduled to send messages at 11:11 PM daily');
});

async function sendWishMessage() {
    try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        await channel.send('11:11, make a wish ✨');
        console.log('Message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Log in to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN);
