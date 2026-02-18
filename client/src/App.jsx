import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Grainient from './Grainient';
import HexagonBackground from './HexagonBackground';
import ShinyText from './ShinyText';

function App() {
    const [state, setState] = useState({
        hackathonName: 'Impact AI Thon',
        timeLeft: 0,
        running: false,
        paused: false,
        initialDuration: 0,
        isFinalMinutes: false,
        logo: '/logo.jpeg'
    });

    const [terminalLine, setTerminalLine] = useState('');
    const finalMusicRef = useRef(null);
    const bgMusicRef = useRef(null);
    const audioInitialized = useRef(false);

    const statusMessages = [
        "Synchronizing with atomic clock...",
        "Network latency: 1.2ms [STABLE]",
        "Monitoring system integrity...",
        "Hackathon mainframe: ACTIVE",
        "Data stream: SECURE",
        "Quantum state: COHERENT"
    ];

    // Socket.IO Logic - Replaces Polling
    useEffect(() => {
        const socket = io('/', {
            path: '/socket.io', // Standard path
            transports: ['websocket', 'polling']
        });

        socket.on('timer-update', (data) => {
            setState(prev => ({
                ...data,
                logo: data.logo || prev.logo
            }));
        });

        socket.on('timer-tick', (data) => {
            setState(prev => ({
                ...data,
                logo: data.logo || prev.logo
            }));
        });

        // Initial fetch to ensure data is present immediately on load
        fetch('/timer/state')
            .then(res => res.json())
            .then(data => {
                setState(prev => ({
                    ...data,
                    logo: data.logo || prev.logo
                }));
            })
            .catch(console.error);

        return () => {
            socket.disconnect();
        };
    }, []);

    // Audio Logic
    useEffect(() => {
        const finalMusic = finalMusicRef.current;
        const bgMusic = bgMusicRef.current;

        if (state.isFinalMinutes && !state.paused && state.running) {
            if (bgMusic) bgMusic.pause();
            if (finalMusic && finalMusic.paused) finalMusic.play().catch(e => console.log("Audio play blocked", e));
        } else if (state.running && !state.paused) {
            if (bgMusic && bgMusic.paused && audioInitialized.current) bgMusic.play().catch(e => console.log("Audio play blocked", e));
        }
    }, [state.isFinalMinutes, state.running, state.paused]);

    // Terminal Effect
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.3) {
                const msg = statusMessages[Math.floor(Math.random() * statusMessages.length)];
                const time = new Date().toLocaleTimeString('en-US', { hour12: false });
                setTerminalLine(`[SYS] ${time} > ${msg}`);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Format time
    const ms = state.timeLeft < 0 ? 0 : state.timeLeft;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Progress
    const percentage = state.initialDuration > 0 ? (state.timeLeft / state.initialDuration) * 100 : 0;

    // Ring math
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const getOffset = (val, max) => circumference - (val / max) * circumference;

    // Ring colors matching the palette
    const ringColors = {
        hours: '#b388ff',
        minutes: '#9eb1ff',
        seconds: '#ff6ec7'
    };
    const videoRef = useRef(null);
    const [timesUp, setTimesUp] = useState(false);
    const prevRunningRef = useRef(false);

    // Detect when the timer finishes: was running, now stopped, and timeLeft is 0
    useEffect(() => {
        // Timer just ended: was running before, now not running, time is up
        if (prevRunningRef.current && !state.running && state.timeLeft <= 0 && state.initialDuration > 0) {
            setTimesUp(true);
        }
        // Timer started again (reset + start): clear timesUp
        if (state.running && state.timeLeft > 0) {
            setTimesUp(false);
        }
        prevRunningRef.current = state.running;
    }, [state.running, state.timeLeft, state.initialDuration]);

    // Auto-play video when timer ends
    useEffect(() => {
        if (timesUp && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => console.log("Video autoplay blocked:", e));
        }
    }, [timesUp]);

    return (
        <>
            {/* Full-screen video overlay when timer ends */}
            {timesUp && (
                <div className="timesup-video-overlay">
                    <video
                        ref={videoRef}
                        className="timesup-video"
                        src="/loading-screen.mp4"
                        autoPlay
                        muted
                        playsInline
                    />
                    <div className="timesup-text-overlay">
                        <h2 className="timesup-title">SEQUENCE COMPLETE</h2>
                    </div>
                </div>
            )}

            {/* Background layers */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1,
                opacity: timesUp ? 0.15 : 1, transition: 'opacity 1s ease'
            }}>
                <Grainient
                    color1="#4a5280"
                    color2="#5c14a8"
                    color3="#3d2d6b"
                    timeSpeed={0.25}
                    colorBalance={0}
                    warpStrength={1}
                    warpFrequency={5}
                    warpSpeed={2}
                    warpAmplitude={50}
                    blendAngle={0}
                    blendSoftness={0.05}
                    rotationAmount={500}
                    noiseScale={2}
                    grainAmount={0.1}
                    grainScale={2}
                    grainAnimated={false}
                    contrast={1.2}
                    gamma={0.85}
                    saturation={0.8}
                    centerX={0}
                    centerY={0}
                    zoom={0.9}
                />
            </div>

            {/* Dark overlay to deepen the background */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(5, 2, 18, 0.45)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <HexagonBackground hexagonSize={75} hexagonMargin={3} />

            {/* UI */}
            <div className="ui-container" style={{
                opacity: timesUp ? 0 : 1,
                transition: 'opacity 1s ease',
                pointerEvents: timesUp ? 'none' : 'auto'
            }}>

                {/* Header Card */}
                <header className="glass-header">
                    <div className="brand-strip">
                        <img src="/Engg Logo1.png" alt="St. Joseph's" className="college-logo" />
                        <div className="brand-text">
                            <div className="subtitle">ST. JOSEPH'S COLLEGE OF ENGINEERING</div>
                            <div className="sub-subtitle">DEPT. OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE</div>
                        </div>
                        <img src="/ads-removebg-preview.png" alt="ADS" className="dept-logo" />
                    </div>

                    <div className="event-title-wrapper">
                        <h1 className="hero-title">
                            <ShinyText
                                text={state.hackathonName}
                                speed={2}
                                delay={0.5}
                                color="#b388ff"
                                shineColor="#ffffff"
                                spread={120}
                                direction="left"
                                yoyo={false}
                                pauseOnHover={false}
                            />
                        </h1>
                        <img src={state.logo || "/logo.jpeg"} alt="Event Logo" className="event-logo" />
                    </div>
                </header>

                {/* Timer */}
                <main className="timer-section">
                    <div className="status-pill" style={{
                        borderColor: state.running ? (state.paused ? '#ffc800' : '#9eb1ff') : '#ff6ec7',
                        color: state.running ? (state.paused ? '#ffc800' : '#9eb1ff') : '#ff6ec7'
                    }}>
                        <span className="dot" style={{
                            backgroundColor: 'currentColor',
                            animation: state.running && !state.paused ? 'blink 2s infinite' : 'none'
                        }}></span>
                        <span className="status-text">
                            {state.running ? (state.paused ? "SYSTEM PAUSED" : "SYSTEM ONLINE") : "SYSTEM READY"}
                        </span>
                    </div>

                    <div className="timer-grid">
                        {[
                            { value: hours, max: 24, label: 'HOURS', color: ringColors.hours },
                            null, // separator
                            { value: minutes, max: 60, label: 'MINUTES', color: ringColors.minutes },
                            null,
                            { value: seconds, max: 60, label: 'SECONDS', color: ringColors.seconds }
                        ].map((item, i) => item === null ? (
                            <div key={i} className="separator">:</div>
                        ) : (
                            <div key={i} className="timer-card">
                                <div className="ring-container">
                                    <svg className="progress-ring" width="220" height="220">
                                        <circle
                                            stroke="rgba(179,136,255,0.06)"
                                            strokeWidth="4"
                                            fill="transparent"
                                            r="90" cx="110" cy="110"
                                        />
                                        <circle
                                            className="progress-ring__circle"
                                            stroke={item.color}
                                            strokeWidth="5"
                                            fill="transparent"
                                            r="90" cx="110" cy="110"
                                            style={{
                                                strokeDasharray: circumference,
                                                strokeDashoffset: getOffset(item.value % item.max, item.max)
                                            }}
                                        />
                                    </svg>
                                    <div className="time-value-wrapper">
                                        <span>{String(item.value).padStart(2, '0')}</span>
                                        <span className="label">{item.label}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="system-footer">
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.max(0, percentage)}%` }}></div>
                    </div>
                    <div className="footer-grid">
                        <div>
                            <span className="stat-label">COMPLETION </span>
                            <span className="stat-value">{Math.ceil(percentage)}%</span>
                        </div>
                        <div className="terminal-box">{terminalLine}_</div>
                    </div>
                </footer>
            </div>

            {/* Audio */}
            <audio ref={bgMusicRef} src="/HackAIThon Anthem.mp3" loop />
            <audio ref={finalMusicRef} src="/(Audio) 15 Minutes of YouTube Cinematic Premiere countdown.m4a" />

            {/* Mute Button */}
            <button
                className="floating-mute"
                onClick={() => {
                    const music = bgMusicRef.current;
                    if (music) {
                        music.muted = !music.muted;
                        audioInitialized.current = true;
                        if (music.muted === false && music.paused) music.play().catch(e => console.log(e));
                    }
                }}
            >
                ♪
            </button>
        </>
    );
}

export default App;
