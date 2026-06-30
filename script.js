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
