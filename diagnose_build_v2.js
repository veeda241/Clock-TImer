const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const logFile = path.join(__dirname, 'diagnostic.log');
// clear file
fs.writeFileSync(logFile, '');
const log = (msg) => {
    try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
};

log('Starting diagnostics...');
try {
    const clientDir = path.join(__dirname, 'client');
    log('Client Dir: ' + clientDir);

    log('Checking src/index.css...');
    if (fs.existsSync(path.join(clientDir, 'src', 'index.css'))) {
        log('YES index.css exists');
    } else {
        log('NO index.css missing');
    }

    log('Running build...');
    // forcing shell execution to capture everything
    const output = execSync('npx vite build', { cwd: clientDir, encoding: 'utf-8', stdio: 'pipe' });
    log('Build Success!');
    log(output);
} catch (e) {
    log('Build Failed!');
    log(e.message);
    if (e.stdout) log('STDOUT:\n' + e.stdout.toString());
    if (e.stderr) log('STDERR:\n' + e.stderr.toString());
}
