require('dotenv').config();
const {
    PermissionFlagsBits,
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel,
    EmbedBuilder
} = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

function registerPartifulHandler(client) {
    // Slash command handler: /partiful link:<url>
    client.on('interactionCreate', async (interaction) => {
        try {
            if (!interaction.isChatInputCommand()) return;
            if (interaction.commandName !== 'partiful') return;

            // Permission check: manage events
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!member.permissions.has(PermissionFlagsBits.ManageEvents)) {
                const failEmbed = new EmbedBuilder()
                    .setColor(0xFF4D4F)
                    .setTitle('❌ Permission required')
                    .setDescription('You need the Manage Events permission to use `/partiful`.');
                await interaction.reply({ embeds: [failEmbed], ephemeral: true });
                return;
            }

            const link = interaction.options.getString('link', true);
            if (!/^https?:\/\/partiful\.com\/e\//i.test(link)) {
                const failEmbed = new EmbedBuilder()
                    .setColor(0xFF4D4F)
                    .setTitle('❌ Invalid link')
                    .setDescription('Please provide a valid Partiful event URL like `https://partiful.com/e/your-event-id`.');
                await interaction.reply({ embeds: [failEmbed], ephemeral: true });
                return;
            }

            await interaction.deferReply();

            const scraped = await scrapePartiful(link, member);

            const startTime = scraped.startTime ?? new Date(Date.now() + 60 * 60 * 1000);
            const endTime = scraped.endTime ?? new Date(startTime.getTime() + 3 * 60 * 60 * 1000);

            const event = await interaction.guild.scheduledEvents.create({
                name: scraped.title || 'Partiful Event',
                description: scraped.description?.slice(0, 950) || 'Created from Partiful',
                scheduledStartTime: startTime,
                scheduledEndTime: endTime,
                privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                entityType: GuildScheduledEventEntityType.External,
                entityMetadata: { location: link },
            });

            const discordEventUrl = `https://discord.com/events/${interaction.guild.id}/${event.id}`;

            const successEmbed = new EmbedBuilder()
                .setColor(0x22C55E)
                .setTitle('✅ Event Created Successfully!')
                .setDescription(
                    [
                        `📅 **Event**: ${scraped.title || event.name}`,
                        `🕒 **Start**: <t:${Math.floor(startTime.getTime() / 1000)}:F>`,
                        `🕛 **End**: <t:${Math.floor(endTime.getTime() / 1000)}:F>`,
                    ].join('\n')
                )
                .addFields(
                    { name: '📝 Description', value: (scraped.description || 'No description available').slice(0, 1024) },
                    { name: '🎉 Partiful', value: `[View Original Event](${link})`, inline: true },
                    { name: '🔗 Discord Event', value: `[Open Event](${discordEventUrl})`, inline: true }
                );

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error handling /partiful:', error);
            if (interaction.isRepliable()) {
                try {
                    const reason = error?.message ? `\n\nDetails: ${error.message}` : '';
                    const failEmbed = new EmbedBuilder()
                        .setColor(0xFF4D4F)
                        .setTitle('❌ Event creation failed')
                        .setDescription('We could not create the event. Please check the link, permissions, and try again.' + reason);
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply({ embeds: [failEmbed] });
                    } else {
                        await interaction.reply({ embeds: [failEmbed], ephemeral: true });
                    }
                } catch (_) {}
            }
        }
    });
}

async function scrapePartiful(url, requesterMember) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0; +https://discord.com)'
    };

    console.log('Scraping Partiful URL:', url);
    console.log('Requester member:', requesterMember);

    const { data: html } = await axios.get(url, { headers });
    const $ = cheerio.load(html);

    const title = $('h1 span').first().text().trim()
        || $('h1').first().text().trim();

    // Times: prefer <time datetime> attributes to preserve timezone from Partiful
    let startTime;
    let endTime;
    const timeEls = $('time');
    console.log('Time elements:', timeEls);
    const startAttr = timeEls.first().attr('datetime');
    const endAttr = timeEls.eq(1).attr('datetime');

    if (startAttr) {
        startTime = parsePartifulDateTime(startAttr);
    }
    if (endAttr) {
        endTime = parsePartifulDateTime(endAttr);
    }

    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);

    // Parse visible text and merge hours/minutes if needed
    const timeText = (timeEls.first().text() || timeEls.eq(1).text() || '').trim();
    console.log('Time text:', timeText);
    const parsed = parseEventTimesText(timeText, $, startAttr ? new Date(startAttr) : undefined);
    if (parsed) {
        if (startTime) {
            // If attr exists but looks like midnight or unspecified time, merge parsed hours
            const s = new Date(startTime);
            if (isMidnightOrDateOnly(startAttr, s)) {
                startTime = setHoursMinutesFrom(s, parsed.start);
            }
        } else {
            startTime = parsed.start;
        }
        if (endTime) {
            const e = new Date(endTime);
            if (isMidnightOrDateOnly(endAttr, e)) {
                endTime = setHoursMinutesFrom(e, parsed.end);
            }
        } else if (parsed.end) {
            // Use same date as start when only parsed end provided
            const e = new Date(startTime || parsed.start);
            endTime = setHoursMinutesFrom(e, parsed.end);
        }
    }

    // Default duration if no end time could be derived
    if (startTime && !endTime) {
        endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
    }

    // Description: try common content containers and fallbacks
    let description = '';
    // Dedicated container
    description = description || $('div[data-testid="event-description"]').text().trim();
    // Section-based
    description = description || $('section:contains("About"):last').text().trim();
    // Sibling div near title
    if (!description) {
        const h1 = $('h1').first();
        const siblingDiv = h1.siblings('div').first();
        const lastChildDiv = siblingDiv.children('div').last();
        const spanText = lastChildDiv.find('span').first().text().trim();
        if (spanText) description = spanText;
    }
    // Meta fallbacks
    description = description || $('meta[property="og:description"]').attr('content') || '';
    description = description || $('meta[name="description"]').attr('content') || '';
    // Last resort
    description = description || $('main').text().slice(0, 1000).trim();
    if (requesterMember) {
        const hostName = requesterMember.displayName || requesterMember.user?.username || 'Host';
        description = `Hosted by ${hostName}\n\n${description}`.trim();
    }

    return { title, description, startTime, endTime };
}

function parseEventTimesText(primaryText, $, baseDateFromAttr) {
    if (!primaryText) return null;

    // Normalize unicode spaces and punctuation, handle "p.m." variants
    let sanitized = primaryText
        .replace(/[\u00A0\u202F\u2007]/g, ' ') // nbsp/thin spaces to normal space
        .replace(/\s+/g, ' ')
        .replace('–', '-')
        .replace(/a\.?m\.?/gi, 'am')
        .replace(/p\.?m\.?/gi, 'pm');
    const now = new Date();

    const rangeMatch = sanitized.match(/(\d{1,2}:\d{2})\s*([ap]m)\s*-\s*(\d{1,2}:\d{2})\s*([ap]m)/i);
    const singleMatch = sanitized.match(/(\d{1,2}:\d{2})\s*([ap]m)/i);

    // Try to extract a date near the time text
    let dateText = $('time').first().attr('datetime') || '';
    if (!dateText) {
        const dateCandidate = sanitized.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun).*?(\d{4})/i);
        if (dateCandidate) dateText = dateCandidate[0];
    }

    const baseDate = baseDateFromAttr || (dateText ? new Date(dateText) : now);
    if (rangeMatch) {
        const start = parseTimeOnDate(baseDate, `${rangeMatch[1]} ${rangeMatch[2]}`);
        let end = parseTimeOnDate(baseDate, `${rangeMatch[3]} ${rangeMatch[4]}`);
        if (end <= start) {
            end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        }
        return { start, end };
    }
    if (singleMatch) {
        const start = parseTimeOnDate(baseDate, `${singleMatch[1]} ${singleMatch[2]}`);
        const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
        return { start, end };
    }
    // 24-hour fallback
    const range24 = sanitized.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    const single24 = sanitized.match(/(\d{1,2}:\d{2})/);
    if (range24) {
        const start = parseTimeOnDate(baseDate, range24[1]);
        let end = parseTimeOnDate(baseDate, range24[2]);
        if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        return { start, end };
    }
    if (single24) {
        const start = parseTimeOnDate(baseDate, single24[1]);
        const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
        return { start, end };
    }
    return null;
}

function parseTimeOnDate(date, timeString) {
    console.log('Parsing time on date:', date, timeString);
    const trimmed = timeString.trim();
    const d = new Date(date);
    // 12-hour format
    let match = trimmed.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
    console.log('Match:', match);
    if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3].toLowerCase();
        if (ampm === 'pm' && hours !== 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
        return d;
    }
    // 24-hour format
    match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        d.setHours(hours, minutes, 0, 0);
        return d;
    }
    return d;
}

function parsePartifulDateTime(attr) {
    if (!attr) return null;
    const normalized = String(attr)
        .replace(/[\u00A0\u202F\u2007]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/a\.?m\.?/gi, 'am')
        .replace(/p\.?m\.?/gi, 'pm')
        .trim();

    // Try native Date first (covers ISO 8601 with timezone info)
    const native = new Date(normalized);
    if (!isNaN(native.getTime())) {
        return native;
    }

    // Try to parse formats like: 2025-01-31 8:30 pm or Jan 31, 2025 8:30pm
    // Date part (anything before time), then time with am/pm
    const match = normalized.match(/^(.*?)(\d{1,2}:\d{2})\s*([ap]m)$/i);
    if (match) {
        const datePart = match[1].trim();
        const timePart = `${match[2]} ${match[3]}`;
        const base = new Date(datePart);
        if (!isNaN(base.getTime())) {
            return parseTimeOnDate(base, timePart);
        }
    }

    // As a last resort return invalid to allow caller fallbacks
    return new Date(NaN);
}

function isMidnightOrDateOnly(attrString, dateObj) {
    if (!dateObj) return true;
    // If attribute had no time component or time is midnight, treat as needing merge
    if (attrString && !/T\d{2}:\d{2}/.test(attrString)) return true;
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    return hours === 0 && minutes === 0;
}

function setHoursMinutesFrom(targetDate, sourceDate) {
    const d = new Date(targetDate);
    d.setHours(sourceDate.getHours(), sourceDate.getMinutes(), 0, 0);
    return d;
}

module.exports = { registerPartifulHandler };


