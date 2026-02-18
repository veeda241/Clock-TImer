const express = require('express');
const path = require('path'); // Need path for serving the admin app
const multer = require('multer');
const cors = require('cors');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in this setup
        methods: ["GET", "POST"]
    }
});

app.use(cors());

// Serve a simple favicon to prevent 404
app.get('/favicon.ico', (req, res) => {
    res.type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏱️</text></svg>');
});

const port = process.env.PORT || 3000;

// --- Multer Setup ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

app.use(express.json());

// Serve the logo file directly due to naming issues (must be before static middleware)
app.get('/logo.jpeg', (req, res) => {
    const fs = require('fs');
    const files = fs.readdirSync(__dirname);
    const logo = files.find(f => f.startsWith('impact') && f.endsWith('.jpeg'));
    if (logo) {
        res.sendFile(path.join(__dirname, logo));
    } else {
        res.status(404).send('Logo not found');
    }
});

app.use(express.static('client/dist'));
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- Serve the new React Admin app ---
app.use('/admin', express.static(path.join(__dirname, 'admin/dist')));
// Handle all requests to /admin or its sub-routes by serving the React app's index.html
// We use a regular expression here because the project's routing library version has
// issues with standard wildcard strings.
app.get(/^\/admin(\/.*)?$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/dist/index.html'));
});

// --- Get Local IP ---
app.get('/system/ip', (req, res) => {
    const os = require('os');
    const nets = os.networkInterfaces();
    let ip = 'localhost';

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                ip = net.address;
                break;
            }
        }
        if (ip !== 'localhost') break;
    }
    res.json({ ip });
});

let timerState = {
    hackathonName: "Impact AI Thon",
    startTime: null, // ISO String
    endTime: null, // ISO String
    paused: false,
    timeLeft: null, // in ms
    running: false,
    initialDuration: 0, // in ms
    isFinalMinutes: false,
    background: null,
    logo: null
};

let countdown;

function updateTimer() {
    if (timerState.running && !timerState.paused) {
        const now = Date.now();
        const remaining = new Date(timerState.endTime).getTime() - now;
        timerState.timeLeft = remaining;

        const fifteenMinutesInMs = 15 * 60 * 1000;
        if (remaining <= fifteenMinutesInMs && !timerState.isFinalMinutes && remaining > 0) {
            timerState.isFinalMinutes = true;
        }

        if (remaining <= 0) {
            clearInterval(countdown);
            timerState.running = false;
            timerState.timeLeft = 0;
            io.emit('timer-update', timerState); // Final update
        }
    }
    // Emit a tick event every second to all clients for synchronization
    // This allows clients to potentially drift less if they just listen to this
    // although they should still calculate locally for smooth animation.
    // Ideally, we send the *state* (endTime, running, etc) and let them calculate,
    // but sending the calculated timeLeft is also fine for simple displays.
    io.emit('timer-tick', timerState);
}

// NEW endpoint for the admin panel
app.post('/timer/config', upload.fields([{ name: 'background', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), (req, res) => {
    const { hackathonName, hackathonStartTime, hackathonEndTime } = req.body;

    if (!hackathonName || !hackathonStartTime || !hackathonEndTime) {
        return res.status(400).json({ error: 'Hackathon name, start time, and end time are required.' });
    }

    const startTimeMs = new Date(hackathonStartTime).getTime();
    const endTimeMs = new Date(hackathonEndTime).getTime();

    if (isNaN(startTimeMs) || isNaN(endTimeMs) || startTimeMs >= endTimeMs) {
        return res.status(400).json({ error: 'Invalid start or end time.' });
    }

    clearInterval(countdown);

    timerState = {
        ...timerState,
        hackathonName,
        startTime: hackathonStartTime,
        endTime: hackathonEndTime,
        initialDuration: endTimeMs - startTimeMs,
        timeLeft: endTimeMs - startTimeMs,
        running: true, // Configuration starts the timer
        paused: false,
        isFinalMinutes: false,
    };

    if (req.files['background']) {
        timerState.background = '/uploads/' + req.files['background'][0].filename;
    }

    if (req.files['logo']) {
        timerState.logo = '/uploads/' + req.files['logo'][0].filename;
    }

    countdown = setInterval(updateTimer, 1000);
    console.log('Timer configured and started:', timerState);
    io.emit('timer-update', timerState);
    res.json(timerState);
});


app.post('/timer/set', (req, res) => {
    const { duration } = req.body;
    if (!duration) {
        return res.status(400).json({ error: 'Duration is required.' });
    }
    const parts = duration.split(':').map(Number).reverse();
    if (parts.some(isNaN) || parts.length === 0) {
        return res.status(400).json({ error: 'Invalid time format.' });
    }
    let totalMilliseconds = 0;
    totalMilliseconds += (parts[0] || 0) * 1000;
    totalMilliseconds += (parts[1] || 0) * 60 * 1000;
    totalMilliseconds += (parts[2] || 0) * 3600 * 1000;
    totalMilliseconds += (parts[3] || 0) * 24 * 3600 * 1000;
    totalMilliseconds += (parts[4] || 0) * 30 * 24 * 3600 * 1000;

    if (totalMilliseconds <= 0) {
        return res.status(400).json({ error: 'Duration must be positive.' });
    }

    timerState.initialDuration = totalMilliseconds;
    timerState.timeLeft = totalMilliseconds;
    timerState.running = false;
    timerState.paused = false;
    timerState.startTime = null;
    timerState.endTime = null;
    timerState.isFinalMinutes = false;

    clearInterval(countdown);
    io.emit('timer-update', timerState);
    res.json(timerState);
});

app.post('/timer/start', (req, res) => {
    const { duration } = req.body;

    // Case 1: Resume from Pause or Start from Set
    if ((timerState.paused || !timerState.running) && timerState.timeLeft > 0 && !duration) {
        const now = Date.now();
        // Recalculate endTime based on remaining timeLeft
        timerState.startTime = new Date(now).toISOString();
        timerState.endTime = new Date(now + timerState.timeLeft).toISOString();
        timerState.running = true;
        timerState.paused = false;
    } else {
        // Case 2: New Start with Duration
        if (!duration) {
            return res.status(400).json({ error: 'Duration is required.' });
        }
        const parts = duration.split(':').map(Number).reverse();
        if (parts.some(isNaN) || parts.length === 0) {
            return res.status(400).json({ error: 'Invalid time format.' });
        }
        let totalMilliseconds = 0;
        totalMilliseconds += (parts[0] || 0) * 1000;
        totalMilliseconds += (parts[1] || 0) * 60 * 1000;
        totalMilliseconds += (parts[2] || 0) * 3600 * 1000;
        totalMilliseconds += (parts[3] || 0) * 24 * 3600 * 1000;
        totalMilliseconds += (parts[4] || 0) * 30 * 24 * 3600 * 1000;
        if (totalMilliseconds <= 0) {
            return res.status(400).json({ error: 'Duration must be positive.' });
        }
        const now = Date.now();
        timerState.initialDuration = totalMilliseconds;
        timerState.startTime = new Date(now).toISOString();
        timerState.endTime = new Date(now + totalMilliseconds).toISOString();
        timerState.timeLeft = totalMilliseconds;
        timerState.running = true;
        timerState.paused = false;
        timerState.isFinalMinutes = false;
    }

    clearInterval(countdown);
    countdown = setInterval(updateTimer, 1000);
    io.emit('timer-update', timerState);
    res.json(timerState);
});

app.post('/timer/pause', (req, res) => {
    if (timerState.running && !timerState.paused) {
        timerState.paused = true;
        io.emit('timer-update', timerState);
    }
    res.json(timerState);
});

app.post('/timer/reset', (req, res) => {
    clearInterval(countdown);
    timerState.timeLeft = timerState.initialDuration;
    timerState.running = false;
    timerState.paused = false;
    timerState.isFinalMinutes = false;
    timerState.startTime = null;
    timerState.endTime = null;
    timerState.initialDuration = 0;
    timerState.timeLeft = null;

    io.emit('timer-update', timerState);
    res.json(timerState);
});

app.post('/timer/add', (req, res) => {
    const { ms } = req.body; // milliseconds to add
    if (!ms || ms <= 0) {
        return res.status(400).json({ error: 'Positive milliseconds value required.' });
    }

    if (timerState.running) {
        // Extend the end time
        const currentEnd = new Date(timerState.endTime).getTime();
        timerState.endTime = new Date(currentEnd + ms).toISOString();
        timerState.initialDuration += ms;
        timerState.timeLeft += ms;
    } else {
        // If not running, set a new duration
        const now = Date.now();
        const totalMs = (timerState.timeLeft || 0) + ms;
        timerState.initialDuration = totalMs;
        timerState.startTime = new Date(now).toISOString();
        timerState.endTime = new Date(now + totalMs).toISOString();
        timerState.timeLeft = totalMs;
        timerState.running = true;
        timerState.paused = false;
        timerState.isFinalMinutes = false;
        clearInterval(countdown);
        countdown = setInterval(updateTimer, 1000);
    }

    res.json(timerState);
    io.emit('timer-update', timerState);
});

app.get('/timer/state', (req, res) => {
    if (timerState.running && !timerState.paused) {
        const now = Date.now();
        timerState.timeLeft = new Date(timerState.endTime).getTime() - now;
    }
    res.json(timerState);
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // Send current state immediately upon connection
    socket.emit('timer-update', timerState);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`\n=== IMPACT AI-THON TIMER ===`);
    console.log(`Server:  http://localhost:${port}`);
    console.log(`Display: http://localhost:${port}/ (Standard)`);
    console.log(`Control: http://localhost:${port}/control.html (with QR)`);
    console.log(`Mobile:  http://localhost:${port}/mobile.html`);
    console.log(`=============================\n`);
});