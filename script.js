let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let laps = [];
let lastLapTime = 0;

const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const msEl = document.getElementById('ms');
const startStopBtn = document.getElementById('startStop');
const resetBtn = document.getElementById('reset');
const controls = document.getElementById('controls');
const lapsList = document.getElementById('lapsList');
const fastestEl = document.getElementById('fastest');
const slowestEl = document.getElementById('slowest');
const averageEl = document.getElementById('average');
const themeToggle = document.getElementById('themeToggle');
const exportBtn = document.getElementById('export');
const bgBtn = document.getElementById('bgBtn');
const bgModal = document.getElementById('bgModal');
const closeBg = document.getElementById('closeBg');
const bgUpload = document.getElementById('bgUpload');
const removeBg = document.getElementById('removeBg');
const bgOverlay = document.getElementById('bgOverlay');

function formatTime(time) {
  const ms = Math.floor(time % 1000);
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / 60000) % 60);
  return {
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    ms: String(ms).padStart(3, '0'),
    short: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
  };
}

function updateDisplay() {
  const currentTime = isRunning? Date.now() - startTime + elapsedTime : elapsedTime;
  const t = formatTime(currentTime);
  minutesEl.textContent = t.minutes;
  secondsEl.textContent = t.seconds;
  msEl.textContent = t.ms;
}

function start() {
  if (!isRunning) {
    isRunning = true;
    startTime = Date.now();
    timerInterval = setInterval(updateDisplay, 10);
    startStopBtn.textContent = 'Stop';
    startStopBtn.className = 'btn-stop';
    resetBtn.disabled = true;
    controls.classList.add('three');
    if (!document.getElementById('lap')) {
      const lapBtn = document.createElement('button');
      lapBtn.id = 'lap';
      lapBtn.className = 'btn-lap';
      lapBtn.textContent = 'Lap';
      lapBtn.onclick = lap;
      controls.insertBefore(lapBtn, resetBtn);
    }
    beep(800, 50);
  }
}

function stop() {
  if (isRunning) {
    isRunning = false;
    elapsedTime += Date.now() - startTime;
    clearInterval(timerInterval);
    startStopBtn.textContent = 'Start';
    startStopBtn.className = 'btn-start';
    resetBtn.disabled = false;
    document.getElementById('lap').disabled = true;
    beep(400, 50);
  }
}

function reset() {
  isRunning = false;
  clearInterval(timerInterval);
  elapsedTime = 0;
  lastLapTime = 0;
  laps = [];
  updateDisplay();
  renderLaps();
  updateStats();
  startStopBtn.textContent = 'Start';
  startStopBtn.className = 'btn-start';
  resetBtn.disabled = true;
  controls.classList.remove('three');
  const lapBtn = document.getElementById('lap');
  if (lapBtn) lapBtn.remove();
}

function lap() {
  if (!isRunning) return;
  const currentTime = Date.now() - startTime + elapsedTime;
  const lapTime = currentTime - lastLapTime;
  lastLapTime = currentTime;
  laps.unshift({ lapTime, totalTime: currentTime });
  renderLaps();
  updateStats();
  beep(1000, 30);
}

function renderLaps() {
  if (laps.length === 0) {
    lapsList.innerHTML = '<div style="padding:20px;text-align:center;opacity:0.5">No laps yet</div>';
    return;
  }
  const lapTimes = laps.map(l => l.lapTime);
  const min = Math.min(...lapTimes);
  const max = Math.max(...lapTimes);
  
  lapsList.innerHTML = laps.map((lap, i) => {
    const num = laps.length - i;
    const isFastest = lap.lapTime === min && laps.length > 1;
    const isSlowest = lap.lapTime === max && laps.length > 1;
    return `
      <div class="lap ${isFastest? 'fastest' : ''} ${isSlowest? 'slowest' : ''}">
        <div>#${num}</div>
        <div>${formatTime(lap.lapTime).short}</div>
        <div>${formatTime(lap.totalTime).short}</div>
      </div>
    `;
  }).join('');
}

function updateStats() {
  if (laps.length === 0) {
    fastestEl.textContent = slowestEl.textContent = averageEl.textContent = '--:--';
    return;
  }
  const lapTimes = laps.map(l => l.lapTime);
  const min = Math.min(...lapTimes);
  const max = Math.max(...lapTimes);
  const avg = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
  fastestEl.textContent = formatTime(min).short;
  slowestEl.textContent = formatTime(max).short;
  averageEl.textContent = formatTime(avg).short;
}

function beep(freq, duration) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch(e) {}
}

function exportCSV() {
  if (laps.length === 0) return alert('No laps to export');
  let csv = 'Lap,Lap Time,Total Time\n';
  laps.slice().reverse().forEach((lap, i) => {
    csv += `${i+1},${formatTime(lap.lapTime).short},${formatTime(lap.totalTime).short}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chronox-laps-${Date.now()}.csv`;
  a.click();
}

// Background Wallpaper Functions
function setBackground(url) {
  if (url === 'none') {
    bgOverlay.classList.remove('active');
    localStorage.removeItem('stopwatch_bg');
  } else {
    bgOverlay.style.backgroundImage = `url(${url})`;
    bgOverlay.classList.add('active');
    localStorage.setItem('stopwatch_bg', url);
  }
  document.querySelectorAll('.bg-preset').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-bg="${url}"]`)?.classList.add('active');
}

function loadBackground() {
  const savedBg = localStorage.getItem('stopwatch_bg');
  if (savedBg) setBackground(savedBg);
}

bgBtn.onclick = () => bgModal.classList.add('active');
closeBg.onclick = () => bgModal.classList.remove('active');
bgModal.onclick = (e) => { if (e.target === bgModal) bgModal.classList.remove('active'); };

document.querySelectorAll('.bg-preset').forEach(preset => {
  preset.onclick = () => setBackground(preset.dataset.bg);
});

bgUpload.onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => setBackground(e.target.result);
    reader.readAsDataURL(file);
    bgModal.classList.remove('active');
  }
};

removeBg.onclick = () => {
  setBackground('none');
  bgModal.classList.remove('active');
};

// Event listeners
startStopBtn.onclick = () => isRunning? stop() : start();
resetBtn.onclick = reset;
exportBtn.onclick = exportCSV;
themeToggle.onclick = () => {
  const isDark = document.body.getAttribute('data-theme')!== 'light';
  document.body.setAttribute('data-theme', isDark? 'light' : 'dark');
  themeToggle.textContent = isDark? '☀️ Light' : '🌙 Dark';
  localStorage.setItem('theme', isDark? 'light' : 'dark');
};


const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.body.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'light'? '☀️ Light' : '🌙 Dark';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); isRunning? stop() : start(); }
  if (e.key === 'l' || e.key === 'L') { e.preventDefault(); lap(); }
  if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reset(); }
  if (e.key === 'Escape') { bgModal.classList.remove('active'); }
});

updateDisplay();
renderLaps();
loadBackground();