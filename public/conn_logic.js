
// Add connection handling logic to control.js (append to end)
/*
// --- Connection Handling ---
socket.on('connect', () => {
    const dot = document.getElementById('connection-dot');
    const label = document.getElementById('connLabel');
    if(dot) dot.style.background = '#00ff88';
    if(label) label.textContent = 'CONNECTED' + (SERVER_URL ? ' (REMOTE)' : ' (LOCAL)');
});

socket.on('disconnect', () => {
    const dot = document.getElementById('connection-dot');
    const label = document.getElementById('connLabel');
    if(dot) dot.style.background = '#ff3c6e';
    if(label) label.textContent = 'DISCONNECTED';
});

window.resetServer = function() {
    const current = localStorage.getItem('server_url');
    const newUrl = prompt("Enter Server URL (leave empty for localhost):", current || "");
    if (newUrl !== null) {
        if(newUrl.trim() === "") {
             localStorage.removeItem('server_url');
        } else {
             localStorage.setItem('server_url', newUrl.trim());
        }
        window.location.reload();
    }
};
*/
