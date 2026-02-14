const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const logPath = 'c:/hackathon/Gemini_CLI/Clock-TImer/build_via_node.log';
const log = fs.createWriteStream(logPath, { flags: 'a' });

log.write('Starting build process...\n');

const clientDir = path.join(__dirname, 'client');
log.write(`Client directory: ${clientDir}\n`);

// Run npm install
const install = spawn('npm.cmd', ['install'], { cwd: clientDir, shell: true });

install.stdout.on('data', (data) => log.write(`INSTALL STDOUT: ${data}`));
install.stderr.on('data', (data) => log.write(`INSTALL STDERR: ${data}`));

install.on('close', (code) => {
    log.write(`npm install exited with code ${code}\n`);
    if (code !== 0) return;

    // Run npm run build
    const build = spawn('npm.cmd', ['run', 'build'], { cwd: clientDir, shell: true });

    build.stdout.on('data', (data) => log.write(`BUILD STDOUT: ${data}`));
    build.stderr.on('data', (data) => log.write(`BUILD STDERR: ${data}`));

    build.on('close', (code) => {
        log.write(`npm run build exited with code ${code}\n`);
    });
});
