import React, { useState, useEffect } from 'react';

const MobileControl: React.FC = () => {
  const [timerState, setTimerState] = useState({
    timeLeft: 0,
    running: false,
    paused: false,
  });
  const [timeInput, setTimeInput] = useState("00:00:30");

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

  const formatTime = (ms: number) => {
    if (ms === null || ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', color: 'white', background: '#0D0221' }}>
      <h2>Mobile Control</h2>
      <div style={{ fontSize: '3rem', margin: '20px 0' }}>
        {formatTime(timerState.timeLeft)}
      </div>
      <div>
        <input
          type="text"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          placeholder="HH:MM:SS"
          style={{ fontSize: '1.2rem', padding: '10px', textAlign: 'center', width: '150px', marginRight: '10px', background: '#333', color: 'white', border: '1px solid #555' }}
        />
      </div>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => postCommand('start', { duration: timeInput })} disabled={timerState.running && !timerState.paused} style={{ fontSize: '1.2rem', padding: '10px 20px', margin: '5px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Start</button>
        <button onClick={() => postCommand('pause')} disabled={!timerState.running || timerState.paused} style={{ fontSize: '1.2rem', padding: '10px 20px', margin: '5px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '5px' }}>Pause</button>
        <button onClick={() => postCommand('reset')} style={{ fontSize: '1.2rem', padding: '10px 20px', margin: '5px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>Reset</button>
      </div>
    </div>
  );
};

export default MobileControl;
