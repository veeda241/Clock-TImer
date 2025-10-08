const timerDisplay = document.getElementById('timer-display');

function formatTime(ms) {
    if (ms === null || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function updateTimer() {
    try {
        const response = await fetch('/timer/state');
        const state = await response.json();

        if (state.timeLeft <= 0 && state.running) {
            timerDisplay.innerHTML = "Time's Up!";
        } else {
            timerDisplay.innerHTML = formatTime(state.timeLeft);
        }
    } catch (error) {
        console.error('Error fetching timer state:', error);
        timerDisplay.innerHTML = "ERROR";
    }
}

// Update the timer every second
setInterval(updateTimer, 1000);

// Initial call to display time immediately
updateTimer();
