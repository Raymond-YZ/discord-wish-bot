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

// Listen for messages and respond to mentions
client.on('messageCreate', async (message) => {
    // Ignore messages from bots (including this bot)
    if (message.author.bot) return;
    
    // Check if the bot is mentioned in the message
    if (message.mentions.has(client.user)) {
        console.log(`Bot mentioned by ${message.author.tag}: "${message.content}"`);
        
        // Send the test message when mentioned
        try {
            await sendTestMessage('tf you @\'ing me for?');
            console.log('Test message sent in response to mention!');
        } catch (error) {
            console.error('Error sending mention response:', error);
        }
    }
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

// Function to manually send a test message
async function sendTestMessage(customMessage) {
    try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        await channel.send(customMessage);
        console.log('Test message sent successfully!');
        return true;
    } catch (error) {
        console.error('Error sending test message:', error);
        return false;
    }
}

// Export the test function for external use
module.exports = { sendTestMessage };

// Log in to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN);
