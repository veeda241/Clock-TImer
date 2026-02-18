const timerDisplay = document.getElementById('timer-display');
let SERVER_URL = localStorage.getItem('server_url');

// Clean bad URLs immediately
if (SERVER_URL) {
    try {
        const urlObj = new URL(SERVER_URL);
        if (urlObj.pathname.length > 1) {
            SERVER_URL = urlObj.origin;
            localStorage.setItem('server_url', SERVER_URL);
        }
    } catch (e) { }
}

// AUTO-DETECT: If served from the actual server, use current origin
if (!SERVER_URL && window.location.protocol !== 'file:' && window.location.hostname !== '') {
    SERVER_URL = ''; // Use relative URLs (same origin)
}

const socket = SERVER_URL ? io(SERVER_URL, {
    extraHeaders: {
        "ngrok-skip-browser-warning": "true"
    }
}) : io();

// Ensure fetch calls also use the SERVER_URL
const API_BASE = SERVER_URL ? SERVER_URL : '';
const timeInput = document.getElementById('timeInput');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// --- API Communication ---
async function postCommand(command, body = {}) {
    try {
        const response = await fetch(`${API_BASE}/timer/${command}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
        }
    } catch (error) {
        console.error(`Failed to send ${command} command:`, error);
        alert(`Failed to send ${command} command.`);
    }
}

// --- Event Listeners ---
startBtn.addEventListener('click', () => {
    let duration = timeInput.value;
    if (!duration && !timerDisplay.textContent.includes('Paused')) {
        alert('Please set a duration in HH:MM:SS format.');
        return;
    }
    // Sanitize input
    if (duration) {
        duration = duration.replace(/[ .]/g, ':');
    }
    postCommand('start', { duration });
    timeInput.value = '';

    const music = document.getElementById('background-music');
    if (music && music.paused) {
        music.play().catch(e => console.error("Audio play failed:", e));
        localStorage.setItem('musicWasStarted', 'true');
    }
});

pauseBtn.addEventListener('click', () => {
    postCommand('pause');
    const music = document.getElementById('background-music');
    if (music) {
        music.pause();
    }
});

resetBtn.addEventListener('click', () => {
    postCommand('reset');
});

// --- UI Update ---
function updateStatus(state) {
    if (!state) return;
    try {


        const timerDisplay = document.getElementById('timer-display');
        const timesUpDisplay = document.getElementById('times-up-display');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        const liveIndicator = document.getElementById('live-indicator');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');

        // Update status badge
        if (state.running && !state.paused) {
            statusDot.className = 'status-dot active';
            statusText.textContent = 'ONLINE';
            statusText.style.color = '#00ff88';
        } else if (state.running && state.paused) {
            statusDot.className = 'status-dot paused';
            statusText.textContent = 'PAUSED';
            statusText.style.color = '#ffc800';
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = 'READY';
            statusText.style.color = '';
        }

        if (state.timeLeft <= 0 && state.running) {
            timerDisplay.style.display = 'none';
            timesUpDisplay.style.display = 'block';
            liveIndicator.style.display = 'none';
        } else {
            timerDisplay.style.display = 'flex';
            timesUpDisplay.style.display = 'none';

            const ms = state.timeLeft < 0 || state.timeLeft === null ? 0 : state.timeLeft;
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

            if (state.running && !state.paused) {
                liveIndicator.style.display = 'flex';
            } else {
                liveIndicator.style.display = 'none';
            }
        }

        // Disable/enable buttons based on state
        startBtn.disabled = state.running && !state.paused;
        pauseBtn.disabled = !state.running || state.paused;
        resetBtn.disabled = !state.running && !state.paused;

    } catch (error) {
        console.error('Error fetching timer state:', error);
    }
}



socket.on('timer-update', (state) => {
    updateStatus(state);
});

socket.on('timer-tick', (state) => {
    updateStatus(state);
});

// Initial fetch
fetch(`${API_BASE}/timer/state`)
    .then(res => res.json())
    .then(state => updateStatus(state))
    .catch(console.error);

// --- Audio Controls ---
document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('background-music');
    const muteBtn = document.getElementById('mute-btn');

    let isMuted = localStorage.getItem('musicIsMuted') === 'true';
    muteBtn.textContent = isMuted ? '🔇' : '♪';

    if (localStorage.getItem('musicWasStarted') === 'true') {
        document.body.addEventListener('click', function playMusicOnClick() {
            if (music.paused) {
                music.play().catch(e => console.error("Audio play failed:", e));
            }
            document.body.removeEventListener('click', playMusicOnClick);
        });
    }

    muteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        isMuted = !isMuted;
        music.muted = isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '♪';
        localStorage.setItem('musicIsMuted', isMuted);
    });

    const playPauseBtn = document.getElementById('music-play-pause-btn');
    const volumeSlider = document.getElementById('volume-slider');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (music.paused) {
                music.play().catch(e => console.error("Audio play failed:", e));
                playPauseBtn.textContent = '⏸ PAUSE AUDIO';
            } else {
                music.pause();
                playPauseBtn.textContent = '♪ PLAY AUDIO';
            }
        });
    }

    if (volumeSlider) {
        volumeSlider.value = music.volume;
        volumeSlider.addEventListener('input', (event) => {
            event.stopPropagation();
            music.volume = event.target.value;
        });
    }
});

// --- Preset Buttons ---
const presetBtns = document.querySelectorAll('.preset-btn');
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const duration = btn.dataset.duration;
        timeInput.value = duration;
        // Changed to use 'set' command
        postCommand('set', { duration });
        timeInput.value = '';

        const music = document.getElementById('background-music');
        if (music && music.paused) {
            music.play().catch(e => console.error("Audio play failed:", e));
            localStorage.setItem('musicWasStarted', 'true');
        }
    });
});

// --- Add Time Buttons ---
const add15Btn = document.getElementById('add15Btn');
const add1hrBtn = document.getElementById('add1hrBtn');

if (add15Btn) {
    add15Btn.addEventListener('click', () => {
        fetch(`${API_BASE}/timer/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ms: 15 * 60 * 1000 })
        }).catch(err => console.error('Failed to add time:', err));
    });
}

if (add1hrBtn) {
    add1hrBtn.addEventListener('click', () => {
        fetch(`${API_BASE}/timer/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ms: 60 * 60 * 1000 })
        }).catch(err => console.error('Failed to add time:', err));
    });
}

// --- Connection Handling ---
socket.on('connect', () => {
    const dot = document.getElementById('connection-dot');
    const label = document.getElementById('connLabel');
    if (dot) dot.style.background = '#00ff88';
    if (label) label.textContent = 'CONNECTED' + (SERVER_URL ? ' (REMOTE)' : ' (LOCAL)');
});

socket.on('disconnect', () => {
    const dot = document.getElementById('connection-dot');
    const label = document.getElementById('connLabel');
    if (dot) dot.style.background = '#ff3c6e';
    if (label) label.textContent = 'DISCONNECTED';
});

window.resetServer = function () {
    const current = localStorage.getItem('server_url');
    const newUrl = prompt("Enter Server URL (leave empty for localhost):", current || "");
    if (newUrl !== null) {
        if (newUrl.trim() === "") {
            localStorage.removeItem('server_url');
        } else {
            let cleanedUrl = newUrl.trim();
            // Auto-add protocol if missing
            if (!cleanedUrl.match(/^https?:\/\//)) {
                const isLocal = cleanedUrl.includes('localhost') || cleanedUrl.includes('127.0.0.1') || cleanedUrl.startsWith('192.168.') || cleanedUrl.startsWith('10.');
                cleanedUrl = (isLocal ? 'http://' : 'https://') + cleanedUrl;
            }
            try {
                const urlObj = new URL(cleanedUrl);
                localStorage.setItem('server_url', urlObj.origin);
            } catch (e) {
                // Fallback
                localStorage.setItem('server_url', cleanedUrl);
            }
        }
        window.location.reload();
    }
};
