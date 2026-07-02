function updateStatus(isOnline) {
    const indicator = document.getElementById('status-Indicator');
    if (isOnline) {
        indicator.className = 'status-online';
    } else {
        indicator.className = 'status-offline';
    }
}
async function sendCommand(cmd) {
    const btn = event.target;
    const originalText = btn.innerText;

    btn.innerText = "EXECUTING...";
    btn.style.opacity = "0.5";
    btn.disabled = true;

   const response = await window.electronAPI.sendCommand(cmd)
   if (response.success) {
    logEvent(`System: ${response.message}`);
   }
   setTimeout(() => {
    btn.innerText = originalText;
    btn.disabled = false;
   }, 1000);
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

    if (cpuBar && membar) {
        cpuBar.style.width = stats.cpu
        membar.style.width = stats.memory
        const cpuVal = parseInt(stats.cpu)
        const memVal = parseInt(stats.memory)
        cpuBar.classList.remove('high-load', 'med-load')
        membar.classList.remove('high-load', 'med-load')
        if (cpuVal > 70) cpuBar.classList.add('high-load');
        else if (cpuVal > 45) cpuBar.classList.add('med-load');

        if (memVal > 70) membar.classList.add('high-load');
        else if(memVal > 45) membar.classList.add('med-load')
    }
}, 2000);