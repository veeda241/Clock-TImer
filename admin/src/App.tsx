import { useState, useEffect } from 'react';
import { AdminPanel } from './components/AdminPanel';
import StyledControl from './components/StyledControl';

function App() {
  // State for the AdminPanel props
  const [startTime, setStartTime] = useState(new Date().toISOString());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600 * 1000).toISOString());
  const [hackathonName, setHackathonName] = useState('');

  useEffect(() => {
    fetch('/timer/state')
      .then(res => res.json())
      .then(data => {
        if (data.startTime) {
          setStartTime(data.startTime);
        }
        if (data.endTime) {
          setEndTime(data.endTime);
        }
        if (data.hackathonName) {
          setHackathonName(data.hackathonName);
        }
      })
      .catch(err => console.error("Failed to fetch timer state", err));
  }, []);

  // This function is passed to the AdminPanel
  const handleSave = (newStart: string, newEnd: string, newHackathonName: string, background: File | null, logo: File | null) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    setHackathonName(newHackathonName);
    
    const formData = new FormData();
    formData.append('hackathonName', newHackathonName);
    formData.append('hackathonStartTime', newStart);
    formData.append('hackathonEndTime', newEnd);
    if (background) {
      formData.append('background', background);
    }
    if (logo) {
      formData.append('logo', logo);
    }

    // Send the new configuration to the backend server
    fetch('/timer/config', {
      method: 'POST',
      body: formData,
    }).catch(err => console.error("Failed to save config to server", err));
  };

  return (
    <div className="content-wrapper" style={{background: '#0D0221', color: 'white', fontFamily: "'Orbitron', sans-serif"}}>
        <StyledControl />
        <hr style={{width: '80%', border: '1px solid #00f7ff', margin: '40px auto'}} />
        <AdminPanel
          currentStartTime={startTime}
          currentEndTime={endTime}
          hackathonName={hackathonName}
          onSave={handleSave}
        />
    </div>
  );
}

export default App;

