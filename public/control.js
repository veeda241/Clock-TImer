const timerDisplay = document.getElementById('timer-display');
const timeInput = document.getElementById('timeInput');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// --- API Communication ---
async function postCommand(command, body = {}) {
    try {
        const response = await fetch(`/timer/${command}`, {
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
    const duration = timeInput.value;
    if (!duration && !timerDisplay.textContent.includes('Paused')) {
        alert('Please set a duration in CC:PP:TT format.');
        return;
    }
    postCommand('start', { duration });

    // Play music on start and set flag
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
function formatTime(ms) {
    if (ms === null || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function updateStatus() {
    try {
        const response = await fetch('/timer/state');
        const state = await response.json();

        const timerDisplay = document.getElementById('timer-display');
        const timesUpDisplay = document.getElementById('times-up-display');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        const liveIndicator = document.getElementById('live-indicator');

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

// Update the status every second
setInterval(updateStatus, 1000);

// Initial call to display status immediately
updateStatus();

document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('background-music');
    const muteBtn = document.getElementById('mute-btn');

    // Restore mute state from localStorage
    let isMuted = localStorage.getItem('musicIsMuted') === 'true';
    muteBtn.textContent = isMuted ? 'Unsilence' : 'Silence';

    // If music was ever started, allow it to be played again with a single click
    if (localStorage.getItem('musicWasStarted') === 'true') {
        document.body.addEventListener('click', function playMusicOnClick() {
            if (music.paused) {
                music.play().catch(e => console.error("Audio play failed:", e));
            }
            // Remove this listener so it only fires once per page load
            document.body.removeEventListener('click', playMusicOnClick);
        });
    }

    // Mute button logic
    muteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        isMuted = !isMuted;
        music.muted = isMuted;
        muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
        localStorage.setItem('musicIsMuted', isMuted);
    });

    // --- Advanced Music Controls ---
    const playPauseBtn = document.getElementById('music-play-pause-btn');
    const volumeSlider = document.getElementById('volume-slider');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (music.paused) {
                music.play().catch(e => console.error("Audio play failed:", e));
            } else {
                music.pause();
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
        timeInput.value = duration; // Update the input field for visual feedback
        postCommand('start', { duration });
    });
});
