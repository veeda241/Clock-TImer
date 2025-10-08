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
        alert('Please set a duration in HH:MM:SS format.');
        return;
    }
    postCommand('start', { duration });
});

pauseBtn.addEventListener('click', () => {
    postCommand('pause');
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

        let display = formatTime(state.timeLeft);
        if (state.paused) {
            display += ' (Paused)';
        }
        if (state.timeLeft <= 0 && state.running) {
            display = "Time's Up!";
        }
        timerDisplay.innerHTML = display;

        // Disable/enable buttons based on state
        startBtn.disabled = state.running && !state.paused;
        pauseBtn.disabled = !state.running || state.paused;
        resetBtn.disabled = !state.running && !state.paused;

    } catch (error) {
        console.error('Error fetching timer state:', error);
        timerDisplay.innerHTML = "ERROR";
    }
}

// Update the status every second
setInterval(updateStatus, 1000);

// Initial call to display status immediately
updateStatus();
