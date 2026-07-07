function updateStatus(isOnline) {
    const indicator = document.getElementById('status-Indicator');
    if (isOnline) {
        indicator.className = 'status-online';
    } else {
        indicator.className = 'status-offline';
    }
}
const chooseButton = document.querySelector('.choose');
chooseButton.addEventListener('click', StartServer);
let upTimeInt;
let startTime;

function StartServer () {
const reset = document.querySelector('.reset')
const choose = document.querySelector('.choose')

choose.disabled = true;
choose.innerText = "RUNNING..."
reset.disabled = true
reset.innerText = "RESETING..."

startTime = Date.now();
upTimeInt = setInterval(updateUpTime, 1000);
}

function UpTime () {
const upTimeElement = document.getElementById('uptime-val');
if (!upTimeElement) return;
const totalSeconds = Math.floor((Date.now() - startTime) /1000);
const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
const minutes = Math.floor((totalSeconds % 3600) / 60). toString().padStart(2, '0');
const

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
const addServer = document.getElementById('add-server');
const errorText = document.querySelector('.error');

addServer.addEventListener('click', async () => {
    const result = await window.electronAPI.openFolder();

    if (!result || result.status === 'canceled') return;


    if (result.status === 'error') {
        errorText.style.visibility = 'visible';
        setTimeout(() => {errorText.style.visibility = 'hidden';}, 3000);
        return;
    }
     if (result.status === 'success') {
        errorText.style.visibility = 'hidden';

        const select = document.getElementById('servers');
        const option = document.createElement('option');

        option.text = result.path;
        option.value = result.path;

        select.add(option);
        select.value = result.path

        document.querySelector('.choose').disabled = false;
        document.querySelector('.reset').disabled = false
    }
})
setInterval(async () => {
    const stats = await window.electronAPI.getStats();
    const cpuBar = document.querySelector('.back-bar-cpu');
    const membar = document.querySelector('.back-bar-mem');
    const cpuDis = document.getElementById('cpu-value');
    const memDis = document.getElementById('mem-value');
    const megbyt = document.getElementById('mb')

    if (cpuBar && membar && cpuDis && memDis && megbyt) {
        const cpuVal = parseInt(stats.cpu)
        const memVal = parseInt(stats.memory)
        megbyt.innerText = `${stats.usedMemoryMB} MB / ${stats.totalMemoryMB} MB`
        cpuBar.style.width = stats.cpu
        membar.style.width = stats.memory
        cpuDis.innerText = cpuVal
        memDis.innerText = memVal
        cpuBar.classList.remove('high-load', 'med-load')
        membar.classList.remove('high-load', 'med-load')
        if (cpuVal > 70) cpuBar.classList.add('high-load');
        else if (cpuVal > 45) cpuBar.classList.add('med-load');

        if (memVal > 70) membar.classList.add('high-load');
        else if(memVal > 45) membar.classList.add('med-load')
    }
console.log(cpuBar.classList)
}, 2000);