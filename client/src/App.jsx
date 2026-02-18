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

    // Login State
    const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        // Simple hardcoded check for now, can be sophisticated later
        if (password === 'admin') {
            window.location.href = '/mobile.html';
        } else {
            alert('Access Denied: Invalid Credentials');
        }
    };

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

            {/* Login Button */}
            <button className="admin-login-btn" onClick={() => setIsAdminLoginOpen(true)}>
                LOGIN
            </button>

            {/* Login Modal */}
            {isAdminLoginOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setIsAdminLoginOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'rgba(20, 10, 40, 0.9)',
                        border: '1px solid var(--accent-purple)',
                        padding: '40px', borderRadius: '16px',
                        display: 'flex', flexDirection: 'column', gap: '20px',
                        width: '300px',
                        boxShadow: '0 0 40px rgba(169, 41, 255, 0.2)'
                    }}>
                        <h3 style={{
                            fontFamily: 'Orbitron', color: '#fff', textAlign: 'center',
                            letterSpacing: '2px', fontSize: '1.5rem'
                        }}>SYSTEM ACCESS</h3>
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                type="password"
                                placeholder="ENTER PASSCODE"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', padding: '12px',
                                    borderRadius: '8px', outline: 'none',
                                    fontFamily: 'Space Mono', letterSpacing: '2px',
                                    textAlign: 'center'
                                }}
                            />
                            <button type="submit" style={{
                                background: 'var(--accent-purple)',
                                color: '#000', border: 'none',
                                padding: '12px', borderRadius: '8px',
                                fontFamily: 'Orbitron', fontWeight: 'bold',
                                cursor: 'pointer', letterSpacing: '1px'
                            }}>
                                AUTHENTICATE
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Animated gradient background */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -10,
                background: 'linear-gradient(135deg, #0a0514 0%, #1a0a2e 25%, #0d0620 50%, #160835 75%, #0a0514 100%)',
                backgroundSize: '400% 400%',
                animation: 'bgShift 15s ease infinite',
            }} />

            {/* Watermark logo */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: -5, opacity: 0.04, pointerEvents: 'none',
            }}>
                <img src={state.logo || "/logo.jpeg"} alt="" style={{
                    width: '400px', height: '400px', objectFit: 'contain',
                    filter: 'grayscale(100%) brightness(2)',
                }} />
            </div>

            {/* Subtle grid overlay */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -3,
                backgroundImage: 'radial-gradient(rgba(179, 136, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '30px 30px', pointerEvents: 'none',
            }} />

            {/* Snow Sprinkles */}
            <div className="snow-container">
                {Array.from({ length: 40 }).map((_, i) => {
                    const size = Math.random() * 4 + 2;
                    const left = Math.random() * 100;
                    const duration = Math.random() * 8 + 6;
                    const delay = Math.random() * 10;
                    const opacity = Math.random() * 0.5 + 0.3;
                    return (
                        <div
                            key={i}
                            className="snowflake"
                            style={{
                                left: `${left}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                animationDuration: `${duration}s`,
                                animationDelay: `${delay}s`,
                                opacity,
                            }}
                        />
                    );
                })}
            </div>

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

            {/* Login Button - Separate Element */}
            <button
                className="admin-login-btn"
                onClick={() => setIsAdminLoginOpen(true)}
                style={{ zIndex: 99999 }}
            >
                LOGIN
            </button>

            {/* Login Modal */}
            {isAdminLoginOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', zIndex: 100000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setIsAdminLoginOpen(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'rgba(20, 10, 40, 0.9)',
                        border: '1px solid var(--accent-purple)',
                        padding: '40px', borderRadius: '16px',
                        display: 'flex', flexDirection: 'column', gap: '20px',
                        width: '300px',
                        boxShadow: '0 0 40px rgba(169, 41, 255, 0.2)'
                    }}>
                        <h3 style={{
                            fontFamily: 'Orbitron', color: '#fff', textAlign: 'center',
                            letterSpacing: '2px', fontSize: '1.5rem'
                        }}>SYSTEM ACCESS</h3>
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                type="password"
                                placeholder="ENTER PASSCODE"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', padding: '12px',
                                    borderRadius: '8px', outline: 'none',
                                    fontFamily: 'Space Mono', letterSpacing: '2px',
                                    textAlign: 'center'
                                }}
                            />
                            <button type="submit" style={{
                                background: 'var(--accent-purple)',
                                color: '#000', border: 'none',
                                padding: '12px', borderRadius: '8px',
                                fontFamily: 'Orbitron', fontWeight: 'bold',
                                cursor: 'pointer', letterSpacing: '1px'
                            }}>
                                AUTHENTICATE
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default App;
