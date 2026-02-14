const fs = require('fs');
const path = require('path');

const src = 'impact ai thon logo .jpeg';
const dest = path.join('public', 'impact-logo.jpeg');

if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log('Moved logo successfully');
} else {
    // Try finding it
    const files = fs.readdirSync('.');
    const logo = files.find(f => f.startsWith('impact') && f.endsWith('.jpeg'));
    if (logo) {
        fs.renameSync(logo, dest);
        console.log(`Moved ${logo} successfully`);
    } else {
        console.log('Logo file not found');
    }
}
