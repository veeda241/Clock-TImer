import { useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import StyledControl from './components/StyledControl';

function App() {
  // State for the AdminPanel props
  const [startTime, setStartTime] = useState(new Date().toISOString());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600 * 1000).toISOString());

  // This function is passed to the AdminPanel
  const handleSave = (newStart: string, newEnd: string, hackathonName: string) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    
    // Send the new configuration to the backend server
    fetch('/timer/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        hackathonName: hackathonName,
        hackathonStartTime: newStart, 
        hackathonEndTime: newEnd 
      }),
    }).catch(err => console.error("Failed to save config to server", err));
  };

  return (
    <div className="content-wrapper" style={{background: '#0D0221', color: 'white', fontFamily: "'Orbitron', sans-serif"}}>
        <StyledControl />
        <hr style={{width: '80%', border: '1px solid #00f7ff', margin: '40px auto'}} />
        <AdminPanel
          currentStartTime={startTime}
          currentEndTime={endTime}
          onSave={handleSave}
        />
    </div>
  );
}

export default App;

