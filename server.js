const express = require('express');
const path = require('path'); // Need path for serving the admin app
const multer = require('multer');
const app = express();
const port = 3000;

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
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
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
        }
    }
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
    res.json(timerState);
});


app.post('/timer/start', (req, res) => {
    const { duration } = req.body; // duration in HH:MM:SS

    if (timerState.paused && timerState.timeLeft > 0) {
        timerState.paused = false;
        timerState.running = true;
    } else {
        if (!duration) {
            return res.status(400).json({ error: 'Duration is required for simple start.' });
        }
        const [hours, minutes, seconds] = duration.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return res.status(400).json({ error: 'Invalid time format.' });
        }
        const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
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
        timerState.isFinalMinutes = false; // Reset flag
    }

    clearInterval(countdown);
    countdown = setInterval(updateTimer, 1000);
    res.json(timerState);
});

app.post('/timer/pause', (req, res) => {
    if (timerState.running && !timerState.paused) {
        timerState.paused = true;
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
});

app.get('/timer/state', (req, res) => {
    if (timerState.running && !timerState.paused) {
        const now = Date.now();
        timerState.timeLeft = new Date(timerState.endTime).getTime() - now;
    }
    res.json(timerState);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Timer display: http://localhost:${port}`);
    console.log(`Control panel: http://localhost:${port}/control.html`);
    console.log(`New Admin panel: http://localhost:${port}/admin`);
});