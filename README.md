# 11:11 Wish Bot

A simple Discord bot that sends a "11:11, make a wish ✨" message every day at 11:11 PM in a specified channel.

It now also supports a `/partiful` command to create Discord Scheduled Events from a Partiful event link.

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
     - `Manage Events` (required for `/partiful`)
   - Copy the generated URL and open it in your browser to add the bot to your server

### 2. Configure the Bot
1. Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and add your bot token and channel ID:
   - `DISCORD_BOT_TOKEN` (or `DISCORD_TOKEN`): Your bot token from the Developer Portal
   - `CHANNEL_ID`: The ID of the channel where you want the bot to send messages
   - `CLIENT_ID`: Your application's Client ID (used to deploy slash commands)
   - `GUILD_ID`: The target server ID where commands are registered
     - To get a channel ID, enable Developer Mode in Discord settings, then right-click on the channel and select "Copy ID"

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Bot
```bash
node bot.js
```

### 4.5. Deploy the `/partiful` Slash Command
Before using `/partiful`, deploy the slash command to your server (requires `CLIENT_ID`, `GUILD_ID`, and `DISCORD_BOT_TOKEN`/`DISCORD_TOKEN` in `.env`):

```bash
npm run deploy-commands
```

If you change command definitions, re-run the command above.

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

## Using `/partiful`

The `/partiful` command creates a Discord Scheduled Event by scraping a Partiful event page.

Requirements:
- The user invoking the command must have the **Manage Events** permission
- The bot must have permission to **Manage Events** and **Use Slash Commands** in the server

Usage in Discord:
```
/partiful link:https://partiful.com/e/your-event-id
```

What it does:
- Scrapes the event title, time(s), and description from the Partiful page
- Prepends "Hosted by [Your Username]" to the description
- Creates an external scheduled event with location set to the original Partiful link
- Falls back to sensible defaults if time parsing fails (start = +1h, duration = 2h)

## License
MIT
