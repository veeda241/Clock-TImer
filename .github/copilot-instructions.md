# AI Agent Instructions for Clock-Timer

## Project Overview
This is a web-based countdown timer application with a client-server architecture using Express.js. The application consists of two interfaces:
- A display view (`index.html`) that shows the timer
- A control panel (`control.html`) for managing the timer

## Architecture

### Backend (`server.js`)
- Express.js server maintaining timer state
- Single global timer state object tracking:
  - `endTime`: Target completion time
  - `timeLeft`: Remaining milliseconds
  - `paused`: Pause state
  - `running`: Active state
  - `initialDuration`: Starting duration
- RESTful endpoints:
  ```
  POST /timer/start  - Start/resume timer
  POST /timer/pause  - Pause timer
  POST /timer/reset  - Reset timer
  GET  /timer/state  - Get current state
  ```

### Frontend
- **Display View** (`public/timer.js`):
  - Polls server every second for timer state
  - Updates display in HH:MM:SS format
  - Handles "Time's Up!" state
  
- **Control Panel** (`public/control.js`):
  - Manages timer input in HH:MM:SS format
  - Provides start/pause/reset controls
  - Handles error states with user alerts
  
## Key Patterns

### Time Formatting
Use the `formatTime()` function for consistent time display:
```javascript
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
```

### API Communication
Client-server communication follows this pattern:
```javascript
async function postCommand(command, body = {}) {
    const response = await fetch(`/timer/${command}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    // Handle errors appropriately
}
```

## Development Workflow
1. Start server: `node server.js` (runs on port 3000)
2. Access interfaces:
   - Timer display: http://localhost:3000
   - Control panel: http://localhost:3000/control.html

## Common Tasks
- Adding new timer controls: Extend the timer state object in `server.js` and create corresponding endpoints
- Modifying display format: Update `formatTime()` in both `timer.js` and `control.js`
- Error handling: Use the established pattern of server response validation and client-side alerts