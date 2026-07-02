function updateStatus(isOnline) {
    const indicator = document.getElementById('status-Indicator');
    if (isOnline) {
        indicator.className = 'status-online';
    } else {
        indicator.className = 'status-offline';
    }
}
function sendCommand(cmd) {
    const btn = event.target;
    const originalText = btn.innerText;

    btn.innerText = "EXECUTING...";
    btn.style.opacity = "0.5";
    btn.disabled = true;

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.opacity = "1";
        btn.disabled = false;
        
        logEvent(`System: Command '${cmd.toUpperCase()}' executed successfully.`);
        
        if(cmd === 'start') {
            updateStatus(true);
        } else if (cmd === 'stop') {
            updateStatus(false);
        }
    }, 1500);
}
function logEvent(message) {
    const logWindow = document.getElementById('log-window');
    logWindow.innerHTML += `<br>> ${message}`;
    logWindow.scrollTop = logWindow.scrollHeight;
}
setInterval( async () => {
    const stats = await window.electronAPI.getStats();
    console.log("current stats:", stats);
}, 5000);

setInterval(async () => {
    const stats = await window.electronAPI.getStats();
    const cpuBar = document.getElementById('cpu-bar');
    const membar = document.getElementById('mem-bar');
}, interval);