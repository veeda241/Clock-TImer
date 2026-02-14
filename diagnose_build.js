const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const clientDir = path.join(__dirname, 'client');
console.log('Client Dir:', clientDir);

if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
    console.log('Installing dependencies...');
    try {
        execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
    } catch (e) { console.error('Install failed', e); }
}

console.log('Building...');
try {
    const output = execSync('npx vite build', { cwd: clientDir, encoding: 'utf-8' });
    console.log('Build Output:', output);
} catch (e) {
    console.error('Build Failed:', e.message);
    if (e.stdout) console.log('STDOUT:', e.stdout);
    if (e.stderr) console.error('STDERR:', e.stderr.toString());
}
