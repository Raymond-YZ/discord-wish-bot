# 11:11 Wish Bot

A simple Discord bot that sends a "11:11, make a wish ✨" message every day at 11:11 PM in a specified channel.

## Setup Instructions

### 1. Create a Discord Bot
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click on "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under the "TOKEN" section, click "Copy" to copy your bot token
5. Go to the "OAuth2" > "URL Generator"
   - Select `bot` under Scopes
   - Select these permissions:
     - `Send Messages`
     - `View Channels`
   - Copy the generated URL and open it in your browser to add the bot to your server

### 2. Configure the Bot
1. Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and add your bot token and channel ID:
   - `DISCORD_BOT_TOKEN`: Your bot's token from the Developer Portal
   - `CHANNEL_ID`: The ID of the channel where you want the bot to send messages
     - To get a channel ID, enable Developer Mode in Discord settings, then right-click on the channel and select "Copy ID"

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Bot
```bash
node bot.js
```

### 5. Deployment (Optional)
For 24/7 operation, you can deploy this bot to a cloud service like:
- Replit
- Heroku
- Railway
- A VPS

Make sure to set the environment variables in your hosting platform's settings.

## Timezone Configuration
By default, the bot is set to "America/Los_Angeles" timezone. To change this:
1. Open `bot.js`
2. Find the line with `timezone: 'America/Los_Angeles'`
3. Change it to your preferred timezone (e.g., 'America/New_York', 'Europe/London', etc.)

## License
MIT
