function testParseTimeOnDate() {

    const date = '2025-11-09T09:00:00.000Z';
    const timeString = '91:00 pm';
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
       
    }
    // 24-hour format
    match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        d.setHours(hours, minutes, 0, 0);
       
    }
    console.log('Parsed date:', d);
}

// Invoke the test when running this file directly
testParseTimeOnDate();