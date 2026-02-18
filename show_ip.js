const os = require('os');
const nets = os.networkInterfaces();
let found = false;
console.log('\n--- NETWORK LINKS ---');
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            console.log(`Mobile Remote: http://${net.address}:3000/mobile.html`);
            found = true;
        }
    }
}
if (!found) console.log('Mobile Remote: http://localhost:3000/mobile.html (Use your local IP)');
console.log('---------------------\n');
