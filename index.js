const { stat } = require("original-fs");

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
const logWindow = document.getElementById('log-window');
const serverSelect = document.getElementById('servers');
const serverPath = document.querySelector('.server-address');
const errorText = document.querySelector('.error');
const avgPing = document.getElementById('avgping');
const highPing = document.getElementById('highping');
const servPing = document.getElementById('servping');
resetButton.addEventListener('click', handleReset);
chooseButton.addEventListener('click', StartServer);
serverPath.addEventListener('input', checkSelection);
serverSelect.addEventListener('change', handleServerChange);

let upTimeInt;
let startTime;
let serverPing = 0;
let highestPing = 0;
let averagePing = 0;
let pingSum = 0;
let pingCount = 0;

function checkSelection () {
if (serverSelect.value.trim() === "" || serverPath.value.trim() === "") {
    choose.disabled = true;
    reset.disabled = true;
    serverPath.disabled = true;
} else {
    choose.disabled = false
    reset.disabled = false
    serverPath.disabled = false;
}
};
async function handleServerChange() {
    const selectedPath = serverSelect.value;
    if (selectedPath && selectedPath.trim() !== "") {
        const savedIP = await window.electronAPI.getIpForPath(selectedPath);
        serverPath.value = savedIP || "";
    } else {
        serverPath.value = "";
    }
    checkSelection();
}
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
const selectedPath = serverSelect ? serverSelect.value : '';
const IPAddressValue = serverPath ? serverPath.value : "";
const response = await window.electronAPI.StartServer(selectedPath, IPAddressValue);
if (!response.success) {
    clearInterval(startCounter)
    if (response.reason === "network") {
        errorText.innerText = "incorrect IP address or server offline";
        errorText.style.fontSize = "12px"
        logEvent("Error: Connection Faild (Check IP)");
    } else {
        errorText.innerText = "Could Not Locate Server Files";
        logEvent("Error: Path Verification Failed");
    }
    errorText.style.visibility = 'visible';

    setTimeout(() => {
        errorText.style.visibility = 'hidden';
        errorText.innerText = "Not a Server Address"
    }, 3000);
    choose.innerText = "SELECT-SERVER"
    choose.disabled = false;
    reset.disabled = false;
    addServer.disabled = false;
    return;
}
if (response.success) {
    logEvent("Server Found");
    await window.electronAPI.saveServerAddress(selectedPath, IPAddressValue);
    choose.innerText = "SELECT-FILES";
    choose.disabled = true;
    reset.disabled = false;
    addServer.disabled = true
    clearInterval(startCounter)
    return;
 }
}
async function handleReset () {
logEvent("Resetting Server...")
choose.disabled = true;
reset.disabled = true
reset.innerText = "RESETTING"
addServer.disabled = true
let count = 0
let dotCounter = setInterval(() => {
    count ++
    if (count > 4) {
        count = 0
    }
    reset.innerText = "RESETTING" + ".".repeat(count)
}, 500);
await window.electronAPI.ResetServer()
serverSelect.value = "";
addServer.disabled = false;
logEvent("Server Reset")
clearInterval(dotCounter);
serverPath.value = ""
reset.innerText = "RESET"
choose.innerText = "SELECT-SERVER"
checkSelection();
}
async function sendCommand(cmd) {
    const btn = choose;
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
function configFiles() {
    const configbtn = document.querySelector('.confbtn')
    configbtn.addEventListener('click', async() => {
        const selectedPath = serverSelect.value;
    if (!selectedPath || selectedPath.trim() === "") {
        logEvent("Please Select a Server First");
        return;
    }
    await window.electronAPI.configFiles(selectedPath);
    })
}
function serverFiles() {
    const serverbtn = document.querySelector('.servbtn')
    serverbtn.addEventListener('click', async() => {
        const selectedPath = serverSelect.value;
        if (!selectedPath || selectedPath.trim() === "") {
            logEvent("Please Select a Server First");
            return;
        }
        await window.electronAPI.serverFiles(selectedPath);
    });
}

addServer.addEventListener('click', async () => {
    addServer.disabled = true;
    const result = await window.electronAPI.openFolder();

    if (!result || result.status === 'canceled') { 
        addServer.disabled = false;
        return;}

    if (result.status === 'error') {
        errorText.style.visibility = 'visible';
        setTimeout(() => {errorText.style.visibility = 'hidden';}, 3000);
        addServer.disabled = false
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

        if (result.savedIP) {
            serverPath.value = result.savedIP;
        } else {
            serverPath.value = ""
        }

        checkSelection();

        addServer.disabled = false
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

    if (stats && typeof stats.online !== 'undefined') {
        updateStatus(stats.online);
    }
    if (servPing) {
        if (stats && stats.online && typeof stats.latency === 'number') {
            const currentPing = stats.latency;
            servPing.innerText = stats.latency + " ms";
            if (highestPing === 0 || currentPing > highestPing) {
                highestPing = currentPing;
                if (highPing) highPing.innerText = highestPing + " ms"
            }
            pingCount++;
            pingSum += currentPing;
            averagePing = Math.round(pingSum / pingCount);
            if (avgPing) avgPing.innerText = averagePing + " ms";

        } else {
            servPing.innerText = "--ms"

            highestPing = 0;
            averagePing = 0;
            pingSum = 0;
            pingCount = 0;
            if (highPing) highPing.innerText = "--ms"
            if (avgPing) avgPing.innerText = "--ms"
        }
    }

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
  document.addEventListener("DOMContentLoaded", async () => {
    const pathResult = await window.electronAPI.getSavedPath();
    if (pathResult) {
      const option = document.createElement("option");
      option.text = pathResult
      serverSelect.add(option)
      serverSelect.value = pathResult
      const savedIP = await window.electronAPI.getIpForPath(pathResult);
      serverPath.value = savedIP || "";
    }
    checkSelection();
    configFiles();
    serverFiles();
  });