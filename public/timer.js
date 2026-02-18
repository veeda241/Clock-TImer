/* Global Vars for Visualization */
const socket = io();
const timerDisplay = document.getElementById('timer-display');
const statusTerminal = document.getElementById('terminal-line');
const statusMessages = [
    "Synchronizing with atomic clock...",
    "Network latency: 1.2ms [STABLE]",
    "Monitoring system integrity...",
    "Optimizing display rendering...",
    "Checking participant nodes...",
    "Encrypted connection established.",
    "Background processes: NORMAL",
    "Memory usage: 14%",
    "Hackathon mainframe: ACTIVE",
    "Data stream: SECURE",
    "Time dilation: 0.000001%",
    "Quantum state: COHERENT"
];

/* Typing Effect */
function typeEffect(element, text, speed = 50) {
    if (!element) return;
    element.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, speed);
}

function updateTerminal() {
    if (Math.random() > 0.05) return; // Only update occasionally
    const msg = statusMessages[Math.floor(Math.random() * statusMessages.length)];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    typeEffect(statusTerminal, `[SYSTEM] ${time} > ${msg}`, 30);
}

/* Timer Logic */
let finalMusicPlayed = false;
let victoryPlayed = false;
let videoPlayed = false;
// Radius 90 -> Circumference = 2 * PI * 90 ~= 565.48
const CIRCUMFERENCE_HOURS = 565.48;
const CIRCUMFERENCE_MINUTES = 565.48;
const CIRCUMFERENCE_SECONDS = 565.48;

function setProgress(id, value, max) {
    const circle = document.getElementById(id);
    if (!circle) return;

    const circumference = 565.48;
    const offset = circumference - (value / max) * circumference;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
}

async function updateTimer(state) {
    try {
        if (!state) return;


        // Elements
        const timerContainer = document.getElementById('timer-container');
        const timesUpDisplay = document.getElementById('times-up-display');
        const liveIndicator = document.getElementById('live-indicator');

        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = document.getElementById('progress-percentage');

        const mainMusic = document.getElementById('background-music');
        const finalMusic = document.getElementById('final-15-music');
        const hackathonTitleEl = document.getElementById('hackathon-title');
        const logoEl = document.getElementById('logo');

        // Update basic info
        if (hackathonTitleEl && state.hackathonName && hackathonTitleEl.textContent !== state.hackathonName) {
            hackathonTitleEl.textContent = state.hackathonName;
            hackathonTitleEl.setAttribute('data-text', state.hackathonName);
        }
        if (logoEl && state.logo && logoEl.src !== state.logo) {
            logoEl.src = state.logo;
        }

        // Music Logic
        if (state.running && Math.abs(state.timeLeft - state.initialDuration) < 1000) {
            finalMusicPlayed = false;
            if (finalMusic && !finalMusic.paused) {
                finalMusic.pause();
                finalMusic.currentTime = 0;
            }
            victoryPlayed = false;
            videoPlayed = false;
            const endVideo = document.getElementById('end-video');
            const videoOverlay = document.getElementById('video-overlay');
            if (endVideo) { endVideo.pause(); endVideo.currentTime = 0; }
            if (videoOverlay) videoOverlay.style.display = 'none';
        }
        if (state.isFinalMinutes && !finalMusicPlayed) {
            if (mainMusic) mainMusic.pause();
            if (finalMusic) finalMusic.play().catch(e => console.error("Final music play failed:", e));
            finalMusicPlayed = true;
        } else if (!state.isFinalMinutes && state.running && !state.paused) {
            // Play background anthem if not in final minutes, running, and not paused
            if (mainMusic && mainMusic.paused) {
                mainMusic.play().catch(e => console.log("Background music autoplay blocked:", e));
            }
        } else if (state.paused || !state.running) {
            // Pause background music if timer is paused or stopped
            if (mainMusic && !mainMusic.paused) {
                mainMusic.pause();
            }
            if (finalMusic && !finalMusic.paused) {
                finalMusic.pause();
            }
        }

        // Timer Display Logic
        if (state.timeLeft <= 0 && state.initialDuration > 0) {
            // TIME'S UP
            const endVideo = document.getElementById('end-video');
            const videoOverlay = document.getElementById('video-overlay');
            if (endVideo && videoOverlay && !videoPlayed) {
                videoOverlay.style.display = 'flex';
                // Reset video state
                endVideo.currentTime = 0;
                endVideo.muted = false; // Try unmuted

                const playPromise = endVideo.play();

                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log("Video playing");
                    }).catch(error => {
                        console.warn("Autoplay prevented. Muting and retrying.", error);
                        endVideo.muted = true;
                        endVideo.play();
                    });
                }
                videoPlayed = true;

                // When video ends, hide it? Or loop? Assuming loop or freeze.
                // If it loops:
                // endVideo.loop = true; 
                // If you want it to hide after playing:
                // endVideo.onended = () => { videoOverlay.style.display = 'none'; };
            }

            if (!victoryPlayed && window.triggerVictory) {
                window.triggerVictory();
                victoryPlayed = true;
            }
            if (timerContainer) timerContainer.style.display = 'none';
            if (timesUpDisplay) {
                timesUpDisplay.style.display = 'flex';
                timesUpDisplay.classList.remove('hidden');
            }
            if (liveIndicator) {
                liveIndicator.style.backgroundColor = 'rgba(255, 0, 85, 0.2)';
                liveIndicator.style.borderColor = '#ff0055';
                liveIndicator.querySelector('.status-text').textContent = "SEQUENCE ENDED";
                liveIndicator.querySelector('.dot').style.backgroundColor = '#ff0055';
                liveIndicator.querySelector('.dot').style.animation = 'none';
            }
        } else {
            // RUNNING or PAUSED
            if (timerContainer) timerContainer.style.display = 'flex';
            if (timesUpDisplay) timesUpDisplay.classList.add('hidden');

            const ms = state.timeLeft < 0 || state.timeLeft === null ? 0 : state.timeLeft;
            const totalSeconds = Math.floor(ms / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            // Update Text
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

            // Update Rings
            // Hours: Assume max 24h or 48h? Let's use 24 for ring visual, or just loop
            setProgress('ring-hours', hours % 24, 24);
            setProgress('ring-minutes', minutes, 60);
            setProgress('ring-seconds', seconds, 60);

            // Update Indicator
            if (liveIndicator) {
                if (state.running && !state.paused) {
                    liveIndicator.style.backgroundColor = 'rgba(0, 255, 128, 0.1)';
                    liveIndicator.style.borderColor = '#00ff80';
                    liveIndicator.querySelector('.status-text').textContent = "SYSTEM ONLINE";
                    liveIndicator.querySelector('.dot').style.backgroundColor = '#00ff80';
                    liveIndicator.querySelector('.dot').style.animation = 'blink 2s infinite';
                } else if (state.paused) {
                    liveIndicator.style.backgroundColor = 'rgba(255, 200, 0, 0.1)';
                    liveIndicator.style.borderColor = '#ffc800';
                    liveIndicator.querySelector('.status-text').textContent = "SYSTEM PAUSED";
                    liveIndicator.querySelector('.dot').style.backgroundColor = '#ffc800';
                    liveIndicator.querySelector('.dot').style.animation = 'none';
                } else {
                    // Not running
                    liveIndicator.querySelector('.status-text').textContent = "SYSTEM READY";
                }
            }
        }

        // Progress Bar
        let percentage = 0;
        if (state.initialDuration > 0) {
            // Show ELAPSED time for progress bar filling up? 
            // Or Remaining time shrinking? 
            // Typically "Loading" bars fill up. But countdowns shrink.
            // Let's make it shrink to match "Time Remaining".
            percentage = (state.timeLeft / state.initialDuration) * 100;
        }
        if (progressBar) progressBar.style.width = `${Math.max(0, percentage)}%`;
        if (progressPercentage) progressPercentage.textContent = `${Math.ceil(percentage)}%`;

        updateTerminal();

    } catch (error) {
        console.error('Error fetching timer state:', error);
    }
}



socket.on('timer-update', (data) => {
    updateTimer(data);
});

socket.on('timer-tick', (data) => {
    updateTimer(data);
});

// Request initial state logic if needed, or wait for first tick/update
// But better to fetch once on load to ensure instant display
fetch('/timer/state')
    .then(res => res.json())
    .then(data => updateTimer(data))
    .catch(console.error);

/* --- Canvas Particle Background Removed (Now handled by Grainient.js) --- */

/* Audio Controls */
document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('background-music');
    const muteBtn = document.getElementById('mute-btn');
    let isMuted = localStorage.getItem('musicIsMuted') === 'true';
    if (music) music.muted = isMuted;

    if (muteBtn && music) {
        muteBtn.addEventListener('click', (event) => {
            isMuted = !isMuted;
            music.muted = isMuted;
            localStorage.setItem('musicIsMuted', isMuted);
            // Toggle Icon opacity or color
            muteBtn.style.opacity = isMuted ? '0.5' : '1';

            // If we just unmuted, try to play if it was supposed to be playing
            if (!isMuted && music.paused) {
                music.play().catch(e => console.log("Play failed on unmute:", e));
            }
        });
    }

    // --- Login Logic ---
    const loginBtn = document.getElementById('admin-login-btn');
    const loginOverlay = document.getElementById('login-modal-overlay');
    const loginSubmit = document.getElementById('login-submit-btn');
    const passwordInput = document.getElementById('admin-password');

    if (loginBtn && loginOverlay) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginOverlay.style.display = 'flex';
            passwordInput.focus();
        });

        loginOverlay.addEventListener('click', (e) => {
            if (e.target === loginOverlay) {
                loginOverlay.style.display = 'none';
            }
        });

        const attemptLogin = () => {
            const pass = passwordInput.value;
            if (pass === 'admin') {
                window.location.href = '/mobile.html';
            } else {
                alert('ACCESS DENIED');
                passwordInput.value = '';
            }
        };

        if (loginSubmit) loginSubmit.addEventListener('click', attemptLogin);

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') attemptLogin();
            });
        }
    }
});
