import { useState, useEffect } from 'react';

const StyledControl = () => {
  const [timerState, setTimerState] = useState({
    timeLeft: 0,
    running: false,
    paused: false,
  });
  const [timeInput, setTimeInput] = useState("00:10:00");

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/timer/state')
        .then(res => res.json())
        .then(data => setTimerState(data));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const postCommand = (command: string, body = {}) => {
    fetch(`/timer/${command}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    ).catch(err => console.error(err));
  };

  const formatTimePart = (ms: number, part: 'h' | 'm' | 's') => {
    if (ms === null || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    switch (part) {
      case 'h': return String(hours).padStart(2, '0');
      case 'm': return String(minutes).padStart(2, '0');
      case 's': return String(seconds).padStart(2, '0');
      default: return '00';
    }
  };

  return (
    <main>
        <h2>Chrono-Control</h2>
        <div id="timer-container">
            <div id="timer-display" style={{display: timerState.timeLeft <= 0 && timerState.running ? 'none' : 'flex'}}>
                <div className="time-unit">
                    <span id="hours">{formatTimePart(timerState.timeLeft, 'h')}</span>
                    <div className="time-label">Cycles</div>
                </div>
                <div className="time-separator">:</div>
                <div className="time-unit">
                    <span id="minutes">{formatTimePart(timerState.timeLeft, 'm')}</span>
                    <div className="time-label">Pulses</div>
                </div>
                <div className="time-separator">:</div>
                <div className="time-unit">
                    <span id="seconds">{formatTimePart(timerState.timeLeft, 's')}</span>
                    <div className="time-label">Ticks</div>
                </div>
            </div>
            <div id="times-up-display" style={{display: timerState.timeLeft <= 0 && timerState.running ? 'block' : 'none'}}>SEQUENCE COMPLETE</div>
        </div>
        <div id="live-indicator" style={{display: timerState.running && !timerState.paused ? 'flex' : 'none'}}>
            <span className="live-dot"></span>
            <span>LIVE</span>
        </div>

        <div className="inputs">
            <input type="text" id="timeInput" placeholder="Set Chrono-Sequence (CC:PP:TT)" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} />
        </div>

        <div className="controls">
            <button id="startBtn" onClick={() => postCommand('start', { duration: timeInput })} disabled={timerState.running && !timerState.paused}>Initiate</button>
            <button id="pauseBtn" onClick={() => postCommand('pause')} disabled={!timerState.running || timerState.paused}>Suspend</button>
            <button id="resetBtn" onClick={() => postCommand('reset')}>Nullify</button>
        </div>

        {/* Music controls can be added here if needed */}

    </main>
  );
};

export default StyledControl;
