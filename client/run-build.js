const { execSync } = require('child_process');

try {
    console.log('Running build...');
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('Build success!');
} catch (e) {
    console.error('Build failed!');
    // Error is already printed to stderr due to stdio: inherit
}
