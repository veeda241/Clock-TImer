const fs = require('fs');
const path = require('path');
const logFile = 'c:/hackathon/Gemini_CLI/Clock-TImer/diagnostic.log';
try {
    fs.appendFileSync(logFile, '\n--- NEW RUN ---\n');
    const output = require('child_process').execSync('cd client && npx vite build', { encoding: 'utf-8', stdio: 'pipe' });
    fs.appendFileSync(logFile, output);
} catch (e) {
    fs.appendFileSync(logFile, 'Error: ' + e.message + '\n');
    if (e.stdout) fs.appendFileSync(logFile, 'STDOUT: ' + e.stdout.toString() + '\n');
    if (e.stderr) fs.appendFileSync(logFile, 'STDERR: ' + e.stderr.toString() + '\n');
}
