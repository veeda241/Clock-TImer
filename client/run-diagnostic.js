console.log('Build script start');
const fs = require('fs');
if (!fs.existsSync('node_modules')) {
    console.error('No node_modules!');
    process.exit(1);
}
console.log('node_modules exists');
const { execSync } = require('child_process');
try {
    const output = execSync('npx vite build', { encoding: 'utf-8' });
    console.log('Output:', output);
} catch (e) {
    console.error('Build Error:', e.message);
    console.error('Error Code:', e.status);
    console.error('Error Output:', e.stdout);
    console.error('Error Stderr:', e.stderr);
}
