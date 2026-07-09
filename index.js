function updateStatus(isOnline) {
    const indicator = document.getElementById('status-Indicator');
    if (isOnline) {
        indicator.className = 'status-online';
    } else {
        indicator.className = 'status-offline';
    }
}
const addServer = document.getElementById('add-server');
const chooseButton = document.querySelector('.choose');
const resetButton = document.querySelector('.reset');
const choose = document.querySelector('.choose')
const reset = document.querySelector('.reset')
resetButton.addEventListener('click', ResetServer);
chooseButton.addEventListener('click', StartServer);
const logWindow = document.getElementById('log-window');

let upTimeInt;
let startTime;

async function StartServer () {
logEvent("Fetching Server...")
reset.disabled = true;
choose.disabled = true;
choose.innerText = "RUNNING..."
let startTime = 0
let startCounter = setInterval(() => {
    startTime ++
    if (startTime >4) {
        startTime = 0
    }
    choose.innerText = "RUNNING" + ".".repeat(startTime);
}, 500);
const serverSelect = document.getElementById('servers');
const selectedPath = serverSelect ? serverSelect.value : '';
const response = await window.electronAPI.StartServer(selectedPath);
if (!response.success) {
    clearInterval(startCounter);
    errorText.style.visibility = 'visible' 
    setTimeout(() => {
     errorText.style.visibility = 'hidden' 
    }, 3000);
    logEvent("Could Not Locate Files");
    choose.innerText = "SELECT-SERVER"
    choose.disabled = false
    reset.disabled = false
    return;
}
if (response.success) {
    logEvent("Server Found");
    choose.innerText = "SELECT-FILES";
    choose.disabled = false;
    reset.disabled = false;
    clearInterval(startCounter)
    return;
}
logEvent("Server Found")
choose.innerText = "SELECT-SERVER"
reset.disabled = false
}
async function ResetServer () {
logEvent("Resetting Server...")
choose.disabled = true;
reset.disabled = true
reset.innerText = "RESETTING"
let count = 0
let dotCounter = setInterval(() => {
    count ++
    if (count > 4) {
        count = 0
    }
    reset.innerText = "RESETTING" + ".".repeat(count)
}, 500);
await window.electronAPI.ResetServer()
logEvent("Server Reset")
clearInterval(dotCounter);
reset.innerText = "RESET"
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
    logWindow.innerHTML += `<br>> ${message}`;
    logWindow.scrollTop = logWindow.scrollHeight;
}
setInterval( async () => {
    const stats = await window.electronAPI.getStats();
    console.log("current stats:", stats);
}, 5000);
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
    const megbyt = document.getElementById('mb');
    const uptimeDis = document.getElementById('uptime-val');


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
            if (uptimeDis && stats.uptime) {
                uptimeDis.innerText = stats.uptime
        }
    }
}, 2000);