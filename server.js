const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

let timerState = {
    endTime: null,
    paused: false,
    timeLeft: null, // in ms
    running: false,
    initialDuration: 0 // in ms
};

let countdown;

function updateTimer() {
    if (timerState.running && !timerState.paused) {
        const remaining = timerState.endTime - Date.now();
        timerState.timeLeft = remaining;

        if (remaining <= 0) {
            clearInterval(countdown);
            timerState.running = false;
            timerState.timeLeft = 0;
        }
    }
}

app.post('/timer/start', (req, res) => {
    const { duration } = req.body; // duration in HH:MM:SS

    if (timerState.paused && timerState.timeLeft > 0) {
        timerState.endTime = Date.now() + timerState.timeLeft;
        timerState.paused = false;
        timerState.running = true;
    } else {
        const [hours, minutes, seconds] = duration.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return res.status(400).json({ error: 'Invalid time format.' });
        }
        const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
        if (totalMilliseconds <= 0) {
            return res.status(400).json({ error: 'Duration must be positive.' });
        }
        timerState.initialDuration = totalMilliseconds;
        timerState.endTime = Date.now() + totalMilliseconds;
        timerState.timeLeft = totalMilliseconds;
        timerState.running = true;
        timerState.paused = false;
    }

    clearInterval(countdown);
    countdown = setInterval(updateTimer, 1000);
    res.json(timerState);
});

app.post('/timer/pause', (req, res) => {
    if (timerState.running && !timerState.paused) {
        clearInterval(countdown);
        timerState.paused = true;
        timerState.timeLeft = timerState.endTime - Date.now();
    }
    res.json(timerState);
});

app.post('/timer/reset', (req, res) => {
    clearInterval(countdown);
    timerState.endTime = Date.now() + timerState.initialDuration;
    timerState.timeLeft = timerState.initialDuration;
    timerState.running = true;
    timerState.paused = false;
    // Keep it running on reset
    countdown = setInterval(updateTimer, 1000);
    res.json(timerState);
});

app.get('/timer/state', (req, res) => {
    res.json(timerState);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Timer display: http://localhost:${port}`);
    console.log(`Control panel: http://localhost:${port}/control.html`);
});
