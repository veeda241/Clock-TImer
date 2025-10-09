const timerDisplay = document.getElementById('timer-display');

function formatTime(ms) {
    if (ms === null || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

let finalMusicPlayed = false;

async function updateTimer() {
    try {
        const response = await fetch('/timer/state');
        const state = await response.json();

        const timerDisplay = document.getElementById('timer-display');
        const timesUpDisplay = document.getElementById('times-up-display');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = document.getElementById('progress-percentage');
        const liveIndicator = document.getElementById('live-indicator');
        const mainMusic = document.getElementById('background-music');
        const finalMusic = document.getElementById('final-15-music');
        const hackathonTitleEl = document.getElementById('hackathon-title');

        // Update Hackathon Title
        if (hackathonTitleEl && state.hackathonName) {
            hackathonTitleEl.textContent = state.hackathonName;
        }

        // Reset client-side flag if timer has been reset
        if (state.running && Math.abs(state.timeLeft - state.initialDuration) < 1000) {
            finalMusicPlayed = false;
            if(finalMusic && !finalMusic.paused) {
                finalMusic.pause();
                finalMusic.currentTime = 0;
            }
        }

        // Handle final 15 minutes music
        if (state.isFinalMinutes && !finalMusicPlayed) {
            if (mainMusic) mainMusic.pause();
            if (finalMusic) finalMusic.play().catch(e => console.error("Final music play failed:", e));
            finalMusicPlayed = true;
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

        // Update progress bar
        let percentage = 0;
        if (state.initialDuration > 0) {
            percentage = (state.timeLeft / state.initialDuration) * 100;
        }
        if (progressBar) {
            progressBar.style.width = `${Math.max(0, percentage)}%`;
        }
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.ceil(percentage)}%`;
        }

    } catch (error) {
        console.error('Error fetching timer state:', error);
    }
}

// Update the timer every second
setInterval(updateTimer, 1000);

// Initial call to display time immediately
updateTimer();

document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('background-music');
    const muteBtn = document.getElementById('mute-btn');

    // Restore mute state from localStorage
    let isMuted = localStorage.getItem('musicIsMuted') === 'true';
    music.muted = isMuted;
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
});
