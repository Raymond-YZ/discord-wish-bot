function testPartifulDateTime() {
    const attr = '2025-11-09T09:00:00.000Z';
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
        console.log('Native date:', native);
        return;
    }

    // Try to parse formats like: 2025-01-31 8:30 pm or Jan 31, 2025 8:30pm
    // Date part (anything before time), then time with am/pm
    const match = normalized.match(/^(.*?)(\d{1,2}:\d{2})\s*([ap]m)$/i);
    if (match) {
        const datePart = match[1].trim();
        const timePart = `${match[2]} ${match[3]}`;
        const base = new Date(datePart);
        if (!isNaN(base.getTime())) {
         const d = parseTimeOnDate(base, timePart);
         console.log('Parsed date:', d);
         return;
        }
    }

    // As a last resort return invalid to allow caller fallbacks
    console.log('Invalid date');
}

testPartifulDateTime();