function updateStatus(status) {
  const indicator = document.getElementById("status-Indicator");
  if (status === "ONLINE") {
    indicator.className = "status-online";
  } else if (status === "OFFLINE") {
    indicator.className = "status-offline";
  } else {
    indicator.className = "status-404";
  }
}
const addServer = document.getElementById("add-server");
const chooseButton = document.querySelector(".choose");
const resetButton = document.querySelector(".reset");
const choose = document.querySelector(".choose");
const reset = document.querySelector(".reset");
const logWindow = document.getElementById("log-window");
const serverSelect = document.getElementById("servers");
const serverPath = document.querySelector(".server-address");
const errorText = document.querySelector(".error");
const avgPing = document.getElementById("avgping");
const highPing = document.getElementById("highping");
const servPing = document.getElementById("servping");
const serverbtn = document.querySelector(".servbtn");
const configbtn = document.querySelector(".confbtn");
const backupbtn = document.getElementById("server-backup");
const statusText = document.getElementById("backup-status");

resetButton.addEventListener("click", handleReset);
chooseButton.addEventListener("click", StartServer);
serverPath.addEventListener("input", checkSelection);
serverSelect.addEventListener("change", handleServerChange);
configbtn.addEventListener("click", handleConfigClick);
serverbtn.addEventListener("click", handleServerFilesClick);

let upTimeInt;
let startTime;
let currentServerPing = 0;
let highestPing = 0;
let averagePing = 0;
let pingSum = 0;
let pingCount = 0;
let isServerVerified = false;
let isCoolingDown = false;
let isStartCoolingDown = false;

function checkSelection() {
    if (isStartCoolingDown || isCoolingDown) {
        choose.disabled = true;
        reset.disabled = true;
        return;
    }

  if (serverSelect.value.trim() === "" || serverPath.value.trim() === "") {
    choose.disabled = true;
    reset.disabled = true;
    serverPath.disabled = false;
  } else {
    choose.disabled = isStartCoolingDown || isCoolingDown;
    reset.disabled = false;
    serverPath.disabled = false;
  }
}
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
async function StartServer() {
  if (isStartCoolingDown) return;
  isStartCoolingDown = true;
  choose.disabled = true;
  backupbtn.disabled = true;
  logEvent("Fetching Server...");
  choose.innerText = "RUNNING..."
  let dotCount = 0;
  let startCounter = setInterval(() => {
    dotCount++;
    if (dotCount > 4) {
      dotCount = 0;
    }
    choose.innerText = "RUNNING" + ".".repeat(dotCount);
  }, 500);
  const selectedPath = serverSelect ? serverSelect.value : "";
  const IPAddressValue = serverPath ? serverPath.value : "";
  const response = await window.electronAPI.StartServer(
    selectedPath,
    IPAddressValue,
  );
  if (!response.success) {
    clearInterval(startCounter);
    isServerVerified = false;
    statusText.innerText = "Server Not Verified"
    if (response.reason === "network") {
      errorText.innerText = "incorrect IP address or server offline";
      errorText.style.fontSize = "12px";
      logEvent("Error: Connection Faild (Check IP)");
      backupbtn.disabled = false;
    } else {
      errorText.innerText = "Could Not Locate Server Files";
      logEvent("Error: Path Verification Failed");
      backupbtn.disabled = true;
    }
    errorText.style.visibility = "visible";

    setTimeout(() => {
      errorText.style.visibility = "hidden";
      errorText.innerText = "Not a Server Address";
    }, 3000);
    choose.innerText = "SELECT-SERVER";
    choose.disabled = true;
    reset.disabled = true;
    serverbtn.disabled = true;
    configbtn.disabled = true;
    backupbtn.disabled = true;
    addServer.disabled = false;
    setTimeout(() => {
        isStartCoolingDown = false;
        addServer.disabled = false;
        checkSelection();
    }, 3000);
    return;
  }
  if (response.success) {
    logEvent("Server Found");
    isServerVerified = true;
    startTime = Date.now();
    await window.electronAPI.saveServerAddress(selectedPath, IPAddressValue);
    choose.innerText = "SELECT-FILES";
    choose.disabled = true;
    reset.disabled = false;
    addServer.disabled = true;
    serverbtn.disabled = false;
    configbtn.disabled = false;
    backupbtn.disabled = false;
    statusText.innerText = "Ready to Backup";
    statusText.style.color = "#718096";
    clearInterval(startCounter);
    return;
  }
}
async function handleReset() {
  logEvent("Resetting Server...");
  isServerVerified = false;
  isStartCoolingDown = true;
  choose.disabled = true;
  reset.disabled = true;
  reset.innerText = "RESETTING";
  addServer.disabled = true;
  serverbtn.disabled = true;
  configbtn.disabled = true;
  let count = 0;
  let dotCounter = setInterval(() => {
    count++;
    if (count > 4) {
      count = 0;
    }
    reset.innerText = "RESETTING" + ".".repeat(count);
  }, 500);
  await window.electronAPI.ResetServer();
  serverSelect.value = "";
  addServer.disabled = false;
  backupbtn.disabled = true;
  logEvent("Server Reset");
  clearInterval(dotCounter);
  serverPath.value = "";
  reset.innerText = "RESET";
  choose.innerText = "SELECT-SERVER";
  isStartCoolingDown = false;
  checkSelection();
}
async function sendCommand(cmd) {
  const btn = choose;
  const originalText = btn.innerText;

  btn.innerText = "EXECUTING...";
  btn.style.opacity = "1";
  btn.disabled = true;

  const response = await window.electronAPI.sendCommand(cmd);
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
async function handleConfigClick() {
  const selectedPath = serverSelect.value;
    if (!selectedPath || selectedPath.trim() === "") {
      logEvent("Please Select a Server First");
      return;
    }
    if (!isServerVerified) {
      logEvent("Error: Server IP Must Be Verified First");
      return;
    }
    if (isCoolingDown) {
      logEvent("Please Wait Before Trying Again");
      return;
    }
    isCoolingDown = true;
    configbtn.disabled = true;
    checkSelection();
    await window.electronAPI.configFiles(selectedPath);
    setTimeout(() => {
      isCoolingDown = false;
      configbtn.disabled = false;
    }, 3000);
}
async function handleServerFilesClick() {
    const selectedPath = serverSelect.value;
    if (!selectedPath || selectedPath.trim() === "") {
      logEvent("Please Select a Server First");
      return;
    }
    if (!isServerVerified) {
      logEvent("Error: Server IP Must Be Verified First");
      return;
    }
    if (isCoolingDown) {
      logEvent("Please Wait Before Trying Again");
      return;
    }
    isCoolingDown = true;
    serverbtn.disabled = true;

    await window.electronAPI.serverFiles(selectedPath);
    setTimeout(() => {
      isCoolingDown = false;
      serverbtn.disabled = false;
    }, 3000);
}

addServer.addEventListener("click", async () => {
  addServer.disabled = true;
  const result = await window.electronAPI.openFolder();

  if (!result || result.status === "canceled") {
    addServer.disabled = false;
    return;
  }

  if (result.status === "error") {
    errorText.style.visibility = "visible";
    setTimeout(() => {
      errorText.style.visibility = "hidden";
    }, 3000);
    addServer.disabled = false;
    return;
  }
  if (result.status === "success") {
    errorText.style.visibility = "hidden";

    const select = document.getElementById("servers");
    const option = document.createElement("option");

    option.text = result.path;
    option.value = result.path;

    select.add(option);
    select.value = result.path;

    if (result.savedIP) {
      serverPath.value = result.savedIP;
    } else {
      serverPath.value = "";
    }
    checkSelection();
    addServer.disabled = false;
  }
});
setInterval(async () => {
  const stats = await window.electronAPI.getStats();
  const cpuBar = document.querySelector(".back-bar-cpu");
  const membar = document.querySelector(".back-bar-mem");
  const cpuDis = document.getElementById("cpu-value");
  const memDis = document.getElementById("mem-value");
  const megbyt = document.getElementById("mb");
  const uptimeDis = document.getElementById("uptime-val");
  const playerCountDis = document.getElementById("player-count")

  if (stats && typeof stats.online !== "undefined") {
    updateStatus(stats.online);
    if (playerCountDis && stats.players) {
      playerCountDis.innerText = stats.players;
    }
    if (stats.online === "ONLINE") {
        isServerVerified = true;
        choose.innerText = "SELECT-FILES"
        choose.disabled = true;
        if (!isCoolingDown) {
        reset.disabled = false;
        serverbtn.disabled = false;
        configbtn.disabled = false;
        backupbtn.disabled = false;
        addServer.disabled = true;
        }

        if (statusText.innerText === "" || statusText.innerText === "IPC Connection Failed") {
            statusText.innerText = "Ready to Backup";
            statusText.style.color = '#718096';
        }
    } else if (stats.online === "OFFLINE" || stats.online === "404") {
        if (choose.innerText === "SELECT-FILES") {
            choose.innerText = "SELECT-SERVER";
            checkSelection();
            serverbtn.disabled = true;
            configbtn.disabled = true;
            backupbtn.disabled = true;
            addServer.disabled = false;
        }
    }
  }
  if (servPing) {
    if (stats && stats.online && typeof stats.latency === "number") {
      const currentPing = stats.latency;
      servPing.innerText = stats.latency + " ms";
      if (highestPing === 0 || currentPing > highestPing) {
        highestPing = currentPing;
        if (highPing) highPing.innerText = highestPing + " ms";
      }
      pingCount++;
      pingSum += currentPing;
      averagePing = Math.round(pingSum / pingCount);
      if (avgPing) avgPing.innerText = averagePing + " ms";
    } else {
      servPing.innerText = "--ms";

      highestPing = 0;
      averagePing = 0;
      pingSum = 0;
      pingCount = 0;
      if (highPing) highPing.innerText = "--ms";
      if (avgPing) avgPing.innerText = "--ms";
    }
  }

  if (cpuBar && membar && cpuDis && memDis && megbyt) {
    const cpuVal = parseInt(stats.cpu);
    const memVal = parseInt(stats.memory);
    megbyt.innerText = `${stats.usedMemoryMB} MB / ${stats.totalMemoryMB} MB`;
    cpuBar.style.width = stats.cpu;
    membar.style.width = stats.memory;
    cpuDis.innerText = cpuVal;
    memDis.innerText = memVal;
    cpuBar.classList.remove("high-load", "med-load");
    membar.classList.remove("high-load", "med-load");
    if (cpuVal > 70) cpuBar.classList.add("high-load");
    else if (cpuVal > 45) cpuBar.classList.add("med-load");

    if (memVal > 70) membar.classList.add("high-load");
    else if (memVal > 45) membar.classList.add("med-load");
    if (uptimeDis && stats.uptime) {
      uptimeDis.innerText = stats.uptime;
    }
  }
}, 2000);
document.addEventListener("DOMContentLoaded", async () => {
  const pathResult = await window.electronAPI.getSavedPath();
  if (pathResult) {
    const option = document.createElement("option");
    option.text = pathResult;
    serverSelect.add(option);
    serverSelect.value = pathResult;
    const savedIP = await window.electronAPI.getIpForPath(pathResult);
    serverPath.value = savedIP || "";
  }
  checkSelection();
});
document.getElementById("server-backup").addEventListener("click", async () => {
  const backupbtn = document.getElementById("server-backup");
  backupbtn.disabled = true;
  statusText.innerText = "Copying Server Files... Please Wait";
  statusText.style.color = "#ecc94b";

  try {
    const result = await window.electronAPI.createBackup();

    if (result.success) {
      statusText.innerText = result.message;
      statusText.style.color = "#48BB78";
    } else {
      statusText.innerText = `ERROR: ${result.message}`;
      statusText.style.color = "#F56565";
    }
  } catch (error) {
    statusText.innerText = "IPC Connection Faild";
    statusText.style.color = "#F56565";
  } finally {
    setTimeout(() => {
      backupbtn.disabled = false;
    }, 3000);
  }
});
