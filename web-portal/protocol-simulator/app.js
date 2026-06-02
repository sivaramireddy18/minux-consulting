// PROTOCOL.OS - Embedded Serial Bus Protocol Simulator Logic Engine

// ==========================================
// 1. SOUNDS & CONSTANTS
// ==========================================
let audioContext = null;
function playTick(high = true) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(high ? 1000 : 400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.05);
    gain.gain.setValueAtTime(0.02, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.06);
  } catch (e) {
    // Audio blocked or unsupported
  }
}

// Global UI Elements
const protocolSelect = document.getElementById('protocol-select');
const configContainer = document.getElementById('protocol-config-container');
const errorContainer = document.getElementById('error-injection-container');
const schematicContainer = document.getElementById('nodes-wires-container');
const canvas = document.getElementById('waveform-canvas');
const learningContent = document.getElementById('learning-guide-content');
const logContainer = document.getElementById('analyzer-log-entries');
const glitchAlert = document.getElementById('glitch-warning-alert');

// Statistics DOM Elements
const statPackets = document.getElementById('stat-packets');
const statThroughput = document.getElementById('stat-throughput');
const statEfficiency = document.getElementById('stat-efficiency');
const statErrors = document.getElementById('stat-errors');
const statTxTime = document.getElementById('stat-tx-time');

// Control Buttons
const btnPlayPause = document.getElementById('btn-play-pause');
const btnStepPrev = document.getElementById('btn-step-prev');
const btnStepNext = document.getElementById('btn-step-next');
const btnReset = document.getElementById('btn-reset');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnExportLogs = document.getElementById('btn-export-logs');
const btnSaveSession = document.getElementById('btn-save-session');
const btnLoadSession = document.getElementById('btn-load-session');

// Modals
const btnToggleComparison = document.getElementById('btn-toggle-comparison');
const comparisonModal = document.getElementById('comparison-modal');

// ==========================================
// 2. EVENT LOGGER & DECODER
// ==========================================
class EventLogger {
  constructor() {
    this.logs = [];
  }

  clear() {
    this.logs = [];
    logContainer.innerHTML = '<div style="color:#4b5563; text-align:center; padding:15px 0;">Logic analyzer ready. Start bus transmission...</div>';
  }

  log(timestamp, eventName, dataHex = '', isError = false) {
    const formattedTime = `${parseFloat(timestamp).toFixed(1)}ms`;
    const logObj = { time: formattedTime, event: eventName, data: dataHex, error: isError };
    this.logs.push(logObj);

    if (this.logs.length === 1 && logContainer.querySelector('div[style*="text-align"]')) {
      logContainer.innerHTML = '';
    }

    const row = document.createElement('div');
    row.className = 'log-row';
    row.innerHTML = `
      <span class="log-time">[${formattedTime}]</span>
      <span class="log-event ${isError ? 'log-error text-danger' : ''}">${eventName}</span>
      ${dataHex ? `<span class="log-data">${dataHex}</span>` : ''}
    `;
    logContainer.appendChild(row);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  exportLogs() {
    if (this.logs.length === 0) {
      alert("No event logs captured yet. Run simulation to log packets!");
      return;
    }
    let txt = "=========================================================\n";
    txt += "PROTOCOL.OS - BUS LOGS & DECODED PROTOCOL EVENTS REPORT\n";
    txt += `Timestamp: ${new Date().toISOString()}\n`;
    txt += "=========================================================\n\n";
    txt += "Time     | Event Details                  | Payload\n";
    txt += "---------------------------------------------------------\n";
    this.logs.forEach(l => {
      const paddedTime = l.time.padEnd(8);
      const paddedEvent = l.event.padEnd(30);
      txt += `${paddedTime} | ${paddedEvent} | ${l.data || '-'}\n`;
    });
    
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocol_os_logs_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
const logger = new EventLogger();

// ==========================================
// 3. HIGH-PERFORMANCE WAVEFORM ENGINE (Canvas)
// ==========================================
class WaveformEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.zoomLevel = 1.0;
    this.scrollOffset = 0;
    this.channels = [];
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  setChannels(channelList) {
    // channelList: [{ name: 'SCL', color: '#a855f7' }, ...]
    this.channels = channelList.map((ch, idx) => ({
      name: ch.name,
      color: ch.color,
      yCenter: 40 + idx * 75,
      height: 35
    }));
  }

  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel + 0.25, 4.0);
    playTick(true);
  }

  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
    playTick(true);
  }

  draw(timelineData, currentStep) {
    // timelineData: Array of steps. Each step: { timestamp, channels: { SCL: 1, SDA: 0 } }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (!timelineData || timelineData.length === 0) {
      this.ctx.font = "0.75rem 'JetBrains Mono', monospace";
      this.ctx.fillStyle = "#4b5563";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Timing channels idle. Select configuration & click Run.", this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    const stepWidth = 25 * this.zoomLevel;
    const startX = 75; // Sidebar offset

    // 1. Draw Grid Lines
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    this.ctx.lineWidth = 1;
    for (let x = startX; x < this.canvas.width; x += stepWidth) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height - 30);
      this.ctx.stroke();
    }

    // 2. Draw Time ticks
    this.ctx.fillStyle = "#4b5563";
    this.ctx.font = "0.55rem 'Orbitron', sans-serif";
    this.ctx.textAlign = "center";
    timelineData.forEach((d, idx) => {
      const x = startX + idx * stepWidth;
      if (idx % 2 === 0 && x < this.canvas.width) {
        this.ctx.fillText(`${d.timestamp.toFixed(1)}ms`, x, this.canvas.height - 10);
      }
    });

    // 3. Draw Channel Waveforms
    this.channels.forEach(ch => {
      // Draw Label Background & Name
      this.ctx.fillStyle = "rgba(9, 13, 22, 0.95)";
      this.ctx.fillRect(0, ch.yCenter - 25, startX - 5, 50);
      
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      this.ctx.beginPath();
      this.ctx.moveTo(0, ch.yCenter - 25);
      this.ctx.lineTo(startX - 5, ch.yCenter - 25);
      this.ctx.moveTo(0, ch.yCenter + 25);
      this.ctx.lineTo(startX - 5, ch.yCenter + 25);
      this.ctx.stroke();

      this.ctx.fillStyle = ch.color;
      this.ctx.font = "bold 0.65rem 'Orbitron', sans-serif";
      this.ctx.textAlign = "left";
      this.ctx.fillText(ch.name, 10, ch.yCenter + 4);

      // Draw horizontal reference lines (High / Low dashed)
      this.ctx.strokeStyle = "rgba(255,255,255,0.015)";
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(startX, ch.yCenter - ch.height / 2);
      this.ctx.lineTo(this.canvas.width, ch.yCenter - ch.height / 2);
      this.ctx.moveTo(startX, ch.yCenter + ch.height / 2);
      this.ctx.lineTo(this.canvas.width, ch.yCenter + ch.height / 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // clear dash

      // Draw logic trace
      this.ctx.strokeStyle = ch.color;
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowBlur = 4;
      this.ctx.shadowColor = ch.color;
      this.ctx.beginPath();

      let lastY = 0;
      timelineData.forEach((step, idx) => {
        const x = startX + idx * stepWidth;
        const sigVal = step.channels[ch.name];
        // sigVal = 1 -> high level, sigVal = 0 -> low level
        const y = ch.yCenter - (sigVal === 1 ? ch.height / 2 : -ch.height / 2);

        if (idx === 0) {
          this.ctx.moveTo(x, y);
        } else {
          // Draw horizontal edge
          const prevX = startX + (idx - 1) * stepWidth;
          this.ctx.lineTo(x, lastY);
          // Draw vertical edge
          this.ctx.lineTo(x, y);
        }
        lastY = y;
      });
      this.ctx.stroke();
      this.ctx.shadowBlur = 0; // reset
    });

    // 4. Draw Current Step Cursor Indicator (Red Line Playhead)
    if (currentStep >= 0 && currentStep < timelineData.length) {
      const playheadX = startX + currentStep * stepWidth;
      
      this.ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(playheadX, 0);
      this.ctx.lineTo(playheadX, this.canvas.height - 25);
      this.ctx.stroke();

      // playhead dot
      this.ctx.fillStyle = "var(--accent-rose)";
      this.ctx.beginPath();
      this.ctx.arc(playheadX, this.canvas.height - 25, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
const timingEngine = new WaveformEngine(canvas);

// ==========================================
// 4. BASE PROTOCOL SIMULATOR STATE-MACHINE
// ==========================================
class ProtocolSimulator {
  constructor(name) {
    this.name = name;
    this.isPlaying = false;
    this.currentStep = -1;
    this.timeline = [];
    this.activeErrors = {};
    this.stats = { shifted: 0, throughput: 0, efficiency: 100, errors: 0, txTime: 0 };
    this.playTimer = null;
    this.playbackDelay = 100; // ms per step transition
  }

  loadConfig() {
    // Abstract
  }

  loadFaultButtons() {
    // Abstract
  }

  loadSchematic() {
    // Abstract
  }

  generateTimeline() {
    // Abstract
  }

  start() {
    if (this.timeline.length === 0) {
      this.generateTimeline();
    }
    this.isPlaying = true;
    btnPlayPause.innerText = "Pause";
    btnPlayPause.className = "btn btn-tool btn-danger";
    playTick(true);
    this.playbackLoop();
  }

  pause() {
    this.isPlaying = false;
    btnPlayPause.innerText = "Resume";
    btnPlayPause.className = "btn btn-tool btn-primary";
    playTick(false);
    if (this.playTimer) clearTimeout(this.playTimer);
  }

  reset() {
    this.isPlaying = false;
    this.currentStep = 0;
    btnPlayPause.innerText = "Run";
    btnPlayPause.className = "btn btn-tool btn-primary";
    if (this.playTimer) clearTimeout(this.playTimer);
    logger.clear();
    this.stats = { shifted: 0, throughput: 0, efficiency: 100, errors: 0, txTime: 0 };
    this.activeErrors = {};
    glitchAlert.style.display = 'none';

    // Reload controls state
    this.loadFaultButtons();
    this.generateTimeline();
    this.syncUI();
    playTick(false);
  }

  stepForward() {
    this.pause();
    if (this.currentStep < this.timeline.length - 1) {
      this.currentStep++;
      this.onStepChange();
      playTick(true);
    }
  }

  stepBackward() {
    this.pause();
    if (this.currentStep > 0) {
      this.currentStep--;
      this.onStepChange();
      playTick(false);
    }
  }

  playbackLoop() {
    if (!this.isPlaying) return;
    if (this.currentStep < this.timeline.length - 1) {
      this.currentStep++;
      this.onStepChange();
      this.playTimer = setTimeout(() => this.playbackLoop(), this.playbackDelay);
    } else {
      this.pause();
      btnPlayPause.innerText = "Run";
    }
  }

  onStepChange() {
    const step = this.timeline[this.currentStep];
    
    // Log event if it contains log entries
    if (step.logEntry) {
      logger.log(step.timestamp, step.logEntry, step.logData, step.isErrorLog);
    }

    // Trigger statistics updates
    if (step.statUpdate) {
      Object.assign(this.stats, step.statUpdate);
    }

    // Check clock stretch pauses
    if (step.clockStretching && this.activeErrors['stretch']) {
      this.pause();
      logger.log(step.timestamp, "Clock Stretching Initiated by Slave", '', false);
      learningContent.innerHTML = `
        <h4 style="color:var(--accent-cyan); margin-bottom:6px;">CLOCK STRETCHING INTERPRETED</h4>
        <p>The I2C slave is holding SCL (clock line) LOW, telling the Master it needs more time to process the received byte.</p>
        <p style="margin-top:6px; color:var(--accent-rose); font-weight:bold;">SIMULATOR TIMELINE STRETCHED: Click Resume when slave processes byte.</p>
      `;
      return;
    }

    // Update schematic nodes visualization
    this.animateSchematic(step);

    // Sync views
    this.syncUI();
  }

  animateSchematic(step) {
    // Abstract
  }

  syncUI() {
    timingEngine.draw(this.timeline, this.currentStep);
    
    // Update Explanations Beside steps
    if (this.currentStep >= 0 && this.currentStep < this.timeline.length) {
      const step = this.timeline[this.currentStep];
      if (step.explanation) {
        learningContent.innerHTML = `
          <h4 style="color:var(--accent-cyan); margin-bottom:8px; font-family:'Orbitron',sans-serif;">${step.logEntry || 'Bus Event State'}</h4>
          <p style="line-height:1.5; color:var(--text-main);">${step.explanation}</p>
        `;
      }
    }

    // Update statistics HUD
    statPackets.innerText = this.stats.shifted;
    statThroughput.innerText = `${this.stats.throughput} bps`;
    statEfficiency.innerText = `${this.stats.efficiency}%`;
    statErrors.innerText = this.stats.errors;
    statTxTime.innerText = `${parseFloat(this.stats.txTime).toFixed(1)} ms`;
  }
}

// ==========================================
// 5. I2C SIMULATOR IMPLEMENTATION
// ==========================================
class I2CSimulator extends ProtocolSimulator {
  constructor() {
    super("I2C");
    this.playbackDelay = 180;
  }

  loadConfig() {
    configContainer.innerHTML = `
      <div class="config-row">
        <label for="i2c-slave-select">Active Slave Target Address</label>
        <select class="control-select" id="i2c-slave-select">
          <option value="0x2A" selected>Slave A (0x2A / 7-bit)</option>
          <option value="0x3C">Slave B (0x3C / 7-bit)</option>
          <option value="0x50">Slave C (0x50 / 7-bit)</option>
        </select>
      </div>
      
      <div class="config-row">
        <label for="i2c-speed-select">Clock SCL Bus Speed</label>
        <select class="control-select" id="i2c-speed-select">
          <option value="100000" selected>100 kHz (Standard Mode)</option>
          <option value="400000">400 kHz (Fast Mode)</option>
          <option value="1000000">1 MHz (Fast Mode Plus)</option>
        </select>
      </div>

      <div class="config-row">
        <label for="i2c-data-input">Data Payload Byte (Hex)</label>
        <input type="text" class="control-input" id="i2c-data-input" value="0x55" maxlength="4" style="font-family:'JetBrains Mono',monospace;">
      </div>

      <div class="config-row">
        <label for="i2c-mode-select">Transfer Command Mode</label>
        <select class="control-select" id="i2c-mode-select">
          <option value="write" selected>Write (Command/Data Master to Slave)</option>
          <option value="read">Read (Telemetry Request Slave to Master)</option>
        </select>
      </div>
    `;

    document.getElementById('i2c-slave-select').addEventListener('change', () => this.reset());
    document.getElementById('i2c-speed-select').addEventListener('change', () => this.reset());
    document.getElementById('i2c-data-input').addEventListener('input', () => this.reset());
    document.getElementById('i2c-mode-select').addEventListener('change', () => this.reset());
  }

  loadFaultButtons() {
    errorContainer.innerHTML = `
      <button class="btn-error-inject" id="err-i2c-nack">Force NACK</button>
      <button class="btn-error-inject" id="err-i2c-busy">Bus Busy Lock</button>
      <button class="btn-error-inject" id="err-i2c-arbitration">Collision (Arb Lost)</button>
      <button class="btn-error-inject" id="err-i2c-stretch">Clock Stretch</button>
    `;

    const btnNack = document.getElementById('err-i2c-nack');
    const btnBusy = document.getElementById('err-i2c-busy');
    const btnArb = document.getElementById('err-i2c-arbitration');
    const btnStretch = document.getElementById('err-i2c-stretch');

    btnNack.addEventListener('click', () => {
      this.activeErrors['nack'] = !this.activeErrors['nack'];
      btnNack.classList.toggle('active', this.activeErrors['nack']);
      this.stats.errors += this.activeErrors['nack'] ? 1 : -1;
      this.syncUI();
      playTick(false);
    });

    btnBusy.addEventListener('click', () => {
      this.activeErrors['busy'] = !this.activeErrors['busy'];
      btnBusy.classList.toggle('active', this.activeErrors['busy']);
      this.stats.errors += this.activeErrors['busy'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });

    btnArb.addEventListener('click', () => {
      this.activeErrors['arb'] = !this.activeErrors['arb'];
      btnArb.classList.toggle('active', this.activeErrors['arb']);
      this.stats.errors += this.activeErrors['arb'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });

    btnStretch.addEventListener('click', () => {
      this.activeErrors['stretch'] = !this.activeErrors['stretch'];
      btnStretch.classList.toggle('active', this.activeErrors['stretch']);
      this.stats.errors += this.activeErrors['stretch'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });
  }

  loadSchematic() {
    schematicContainer.innerHTML = `
      <div style="display: flex; justify-content: space-around; align-items: center; width: 100%; height: 100%; padding: 20px;">
        <div class="node-chip master" id="i2c-master">I2C Master<br><span style="font-size:0.6rem; color:var(--text-muted);">CPU Host</span></div>
        
        <svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;">
          <!-- SDA Line -->
          <path id="sda-wire" d="M 130 115 L 260 115 L 260 115 L 430 115" stroke="var(--accent-emerald)" stroke-width="2.5" fill="none" class="bus-wire"/>
          <!-- SCL Line -->
          <path id="scl-wire" d="M 130 135 L 260 135 L 260 135 L 430 135" stroke="var(--accent-violet)" stroke-width="2.5" fill="none" class="bus-wire"/>
          
          <!-- Colored pulse flow bubbles -->
          <circle id="sda-pulse" cx="130" cy="115" r="5" fill="var(--accent-emerald)" style="display:none; filter: drop-shadow(0 0 4px var(--accent-emerald));" />
          <circle id="scl-pulse" cx="130" cy="135" r="5" fill="var(--accent-violet)" style="display:none; filter: drop-shadow(0 0 4px var(--accent-violet));" />
        </svg>

        <div class="node-chip slave" id="i2c-slave">I2C Slave<br><span id="i2c-slave-addr" style="font-size:0.6rem; color:var(--text-muted);">Addr: 0x2A</span></div>
      </div>
    `;
    timingEngine.setChannels([
      { name: 'SCL', color: 'var(--sig-scl)' },
      { name: 'SDA', color: 'var(--sig-sda)' }
    ]);
    timingEngine.draw([], -1);
  }

  generateTimeline() {
    const slaveAddrEl = document.getElementById('i2c-slave-select');
    const slaveAddrStr = slaveAddrEl ? slaveAddrEl.value : '0x2A';
    const slaveAddr = parseInt(slaveAddrStr, 16);
    const slaveAddrLabel = document.getElementById('i2c-slave-addr');
    if (slaveAddrLabel) slaveAddrLabel.innerText = `Addr: ${slaveAddrStr}`;

    const speedEl = document.getElementById('i2c-speed-select');
    const speed = speedEl ? parseInt(speedEl.value) : 100000;
    const dataInput = document.getElementById('i2c-data-input');
    const dataStr = dataInput ? dataInput.value : '0x55';
    const dataByte = parseInt(dataStr, 16) || 0x00;
    const modeSelect = document.getElementById('i2c-mode-select');
    const rWMode = modeSelect ? modeSelect.value : 'write';

    this.timeline = [];
    let time = 0.0;
    
    // Config timing parameters
    const bitPeriod = speed === 100000 ? 1.0 : (speed === 400000 ? 0.3 : 0.1);
    
    // Add dynamic efficiency calculation
    const efficiency = this.activeErrors['nack'] ? 0 : 81; // 18 active frames / 22 total frames
    const throughput = Math.round(speed * (8 / 29)); // relative useful data payload bits

    // 1. Bus Busy Fault Pre-lock state
    if (this.activeErrors['busy']) {
      glitchAlert.style.display = 'block';
      for (let i = 0; i < 6; i++) {
        this.timeline.push({
          timestamp: time,
          channels: { SCL: 0, SDA: 0 },
          logEntry: i === 0 ? "⚠️ HARDWARE FAULT: I2C Bus pre-locked LOW" : '',
          isErrorLog: true,
          explanation: "The physical SDA or SCL line is stuck low (often due to short circuits or missing pull-up resistors). Master is unable to pull lines HIGH to start transfer.",
          statUpdate: { shifted: 0, throughput: 0, efficiency: 0, txTime: time }
        });
        time += bitPeriod;
      }
      return;
    }

    glitchAlert.style.display = 'none';

    // 2. Idle State (Both High)
    this.timeline.push({
      timestamp: time,
      channels: { SCL: 1, SDA: 1 },
      logEntry: "I2C Bus Idle State",
      explanation: "Both SCL (Serial Clock) and SDA (Serial Data) lines are kept HIGH by physical pull-up resistors.",
      statUpdate: { shifted: 0, throughput: 0, efficiency: efficiency, errors: Object.keys(this.activeErrors).length, txTime: 0 }
    });
    time += bitPeriod;

    // 3. START Condition
    this.timeline.push({
      timestamp: time,
      channels: { SCL: 1, SDA: 0 },
      logEntry: "START Condition",
      explanation: "A START condition is initiated by the Master when SDA transitions from HIGH to LOW while SCL remains HIGH.",
      statUpdate: { shifted: 0, throughput: 0, efficiency: efficiency, errors: Object.keys(this.activeErrors).length, txTime: time }
    });
    time += bitPeriod;

    // 4. Address bits transmission (7-bit address)
    let addrBits = [];
    for (let i = 6; i >= 0; i--) {
      addrBits.push((slaveAddr >> i) & 1);
    }

    addrBits.forEach((bit, idx) => {
      // SCL goes low, change data
      this.timeline.push({
        timestamp: time,
        channels: { SCL: 0, SDA: bit },
        explanation: `Master sets Address Bit ${6 - idx} (${bit}) on SDA line while SCL is LOW.`,
        statUpdate: { txTime: time }
      });
      time += bitPeriod / 2;

      // SCL goes high, sample data
      const isCollision = this.activeErrors['arb'] && idx === 4;
      this.timeline.push({
        timestamp: time,
        channels: { SCL: 1, SDA: isCollision ? 0 : bit },
        logEntry: idx === 0 ? "Starting Address Transmission" : (isCollision ? "⚠️ Collision: Arbitration Lost!" : ''),
        isErrorLog: isCollision,
        explanation: isCollision 
          ? "Another Master has pulled the SDA line LOW while this master tried to keep it HIGH. Under I2C rules, this Master immediately loses arbitration and must back off."
          : `I2C Slave samples Address Bit ${6 - idx} value (${bit}) on SCL rising edge.`,
        statUpdate: { txTime: time, errors: this.activeErrors['arb'] ? 1 : 0 }
      });
      time += bitPeriod / 2;

      // If arbitration lost collision injected, stop sequence immediately
      if (isCollision) {
        time += bitPeriod;
        this.timeline.push({
          timestamp: time,
          channels: { SCL: 0, SDA: 1 },
          logEntry: "Master Halted: Backing off",
          explanation: "Master backs off and releases SCL/SDA lines high to allow the winning Master to communicate without bus corruption.",
          statUpdate: { txTime: time }
        });
        return;
      }
    });

    // 5. R/W Bit (0 for Write, 1 for Read)
    const rwBit = rWMode === 'write' ? 0 : 1;
    this.timeline.push({
      timestamp: time,
      channels: { SCL: 0, SDA: rwBit },
      explanation: `Master sets the R/W Direction Bit to ${rwBit} (${rWMode.toUpperCase()}) while SCL is LOW.`,
      statUpdate: { txTime: time }
    });
    time += bitPeriod / 2;

    this.timeline.push({
      timestamp: time,
      channels: { SCL: 1, SDA: rwBit },
      logEntry: `Direction Bit: ${rWMode.toUpperCase()}`,
      explanation: `Slave samples R/W bit on SCL rising edge. ${rwBit === 0 ? '0: Master will Write data' : '1: Master requests telemetry Read'}.`,
      statUpdate: { txTime: time }
    });
    time += bitPeriod / 2;

    // 6. Address ACK/NACK
    const isNack = this.activeErrors['nack'];
    this.timeline.push({
      timestamp: time,
      channels: { SCL: 0, SDA: 1 }, // release SDA
      explanation: "Master releases SDA line high, giving the target Slave full control of the data bus during SCL rising phase.",
      statUpdate: { txTime: time }
    });
    time += bitPeriod / 2;

    this.timeline.push({
      timestamp: time,
      channels: { SCL: 1, SDA: isNack ? 1 : 0 }, // slave pulls low for ACK
      logEntry: isNack ? "⚠️ NACK: Slave address invalid" : `ACK Received from Slave ${slaveAddrStr}`,
      isErrorLog: isNack,
      explanation: isNack 
        ? "Slave has not pulled SDA low (NACK). This indicates either the 7-bit address is incorrect or the slave device is unpowered/disabled."
        : `Slave ${slaveAddrStr} matches address, pulls SDA line LOW to send ACK (Acknowledge) to Master.`,
      statUpdate: { txTime: time }
    });
    time += bitPeriod / 2;

    if (isNack) {
      // Abort transmission early
      this.timeline.push({
        timestamp: time,
        channels: { SCL: 0, SDA: 0 },
        statUpdate: { txTime: time }
      });
      time += bitPeriod;
      this.timeline.push({
        timestamp: time,
        channels: { SCL: 1, SDA: 1 },
        logEntry: "STOP Condition (Aborted)",
        explanation: "Master immediately sends a STOP condition to terminate the aborted transaction safely.",
        statUpdate: { txTime: time }
      });
      return;
    }

    // 7. Clock Stretching Trigger
    if (this.activeErrors['stretch']) {
      // SCL pulled low by slave
      this.timeline.push({
        timestamp: time,
        channels: { SCL: 0, SDA: 1 },
        clockStretching: true,
        explanation: "The Slave pulls the Serial Clock line (SCL) LOW to stretch the master's clock speed. Master stops SCL clock pulse generations.",
        statUpdate: { txTime: time }
      });
      time += bitPeriod;
    }

    // 8. Data Transmission (8 bits)
    let dataBits = [];
    for (let i = 7; i >= 0; i--) {
      dataBits.push((dataByte >> i) & 1);
    }

    dataBits.forEach((bit, idx) => {
      this.timeline.push({
        timestamp: time,
        channels: { SCL: 0, SDA: bit },
        explanation: `Master outputs Data Payload Bit ${7 - idx} (${bit}) on SDA line.`,
        statUpdate: { txTime: time }
      });
      time += bitPeriod / 2;

      this.timeline.push({
        timestamp: time,
        channels: { SCL: 1, SDA: bit },
        logEntry: idx === 0 ? `Transmitting payload ${dataStr}` : '',
        explanation: `Slave samples Data Bit ${7 - idx} value (${bit}) on SCL rising edge.`,
        statUpdate: { txTime: time }
      });
      time += bitPeriod / 2;
    });

    // 9. Data ACK
    this.timeline.push({
      timestamp: time,
      channels: { SCL: 0, SDA: 1 },
      explanation: "Master releases SDA line, waiting for Slave to assert ACK.",
      statUpdate: { txTime: time }
    });
    time += bitPeriod / 2;

    this.timeline.push({
      timestamp: time,
      channels: { SCL: 1, SDA: 0 }, // Slave pulls low
      logEntry: "ACK Received for Data Byte",
      explanation: "Slave successfully processes payload byte, pulling SDA LOW to signal ACK.",
      statUpdate: { shifted: 1, throughput: throughput, efficiency: efficiency, txTime: time }
    });
    time += bitPeriod / 2;

    // 10. STOP Condition
    this.timeline.push({
      timestamp: time,
      channels: { SCL: 0, SDA: 0 },
      explanation: "Master pulls SCL and SDA low in preparation for STOP rising transition.",
      statUpdate: { txTime: time }
    });
    time += bitPeriod / 2;

    this.timeline.push({
      timestamp: time,
      channels: { SCL: 1, SDA: 0 },
      explanation: "Master pulls SCL HIGH first.",
      statUpdate: { txTime: time }
    });
    time += bitPeriod / 2;

    this.timeline.push({
      timestamp: time,
      channels: { SCL: 1, SDA: 1 },
      logEntry: "STOP Condition",
      explanation: "Master initiates a STOP condition by releasing SDA from LOW to HIGH while SCL remains HIGH. The bus becomes idle.",
      statUpdate: { txTime: time }
    });
  }

  animateSchematic(step) {
    const sdaWire = document.getElementById('sda-wire');
    const sclWire = document.getElementById('scl-wire');
    const sdaPulse = document.getElementById('sda-pulse');
    const sclPulse = document.getElementById('scl-pulse');

    const sclVal = step.channels['SCL'];
    const sdaVal = step.channels['SDA'];

    // Update wires glowing states
    sdaWire.style.stroke = sdaVal === 1 ? 'var(--accent-emerald)' : 'rgba(16, 185, 129, 0.2)';
    sclWire.style.stroke = sclVal === 1 ? 'var(--accent-violet)' : 'rgba(168, 85, 247, 0.2)';

    // Animate active bubble pulses along lines
    if (this.isPlaying) {
      sdaPulse.style.display = 'block';
      sclPulse.style.display = 'block';

      // Move cx attributes from master (130) to slave (430)
      const range = 430 - 130;
      const progressPercent = (this.currentStep / this.timeline.length);
      
      sdaPulse.setAttribute('cx', 130 + range * progressPercent);
      sclPulse.setAttribute('cx', 130 + range * progressPercent);
      
      // Update color based on dynamic value
      sdaPulse.setAttribute('fill', sdaVal === 1 ? 'var(--accent-emerald)' : '#ef4444');
      sclPulse.setAttribute('fill', sclVal === 1 ? 'var(--accent-violet)' : '#ef4444');
    } else {
      sdaPulse.style.display = 'none';
      sclPulse.style.display = 'none';
    }

    // Flash error border on glitch locks
    if (step.isErrorLog) {
      document.getElementById('i2c-slave').style.borderColor = 'var(--accent-rose)';
      document.getElementById('i2c-slave').style.boxShadow = '0 0 20px var(--accent-rose-glow)';
      sdaWire.classList.add('glitch');
      sclWire.classList.add('glitch');
    } else {
      document.getElementById('i2c-slave').style.borderColor = 'var(--accent-emerald)';
      document.getElementById('i2c-slave').style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.2)';
      sdaWire.classList.remove('glitch');
      sclWire.classList.remove('glitch');
    }
  }
}

// ==========================================
// 6. SPI SIMULATOR IMPLEMENTATION
// ==========================================
class SPISimulator extends ProtocolSimulator {
  constructor() {
    super("SPI");
    this.playbackDelay = 150;
  }

  loadConfig() {
    configContainer.innerHTML = `
      <div class="config-row">
        <label for="spi-mode-select">SPI Transmission CPOL/CPHA Mode</label>
        <select class="control-select" id="spi-mode-select">
          <option value="0" selected>Mode 0 (CPOL=0, CPHA=0 / Sample Rise)</option>
          <option value="1">Mode 1 (CPOL=0, CPHA=1 / Sample Fall)</option>
          <option value="2">Mode 2 (CPOL=1, CPHA=0 / Sample Fall)</option>
          <option value="3">Mode 3 (CPOL=1, CPHA=1 / Sample Rise)</option>
        </select>
      </div>

      <div class="config-row">
        <label for="spi-freq-select">Clock Frequency (SCLK)</label>
        <select class="control-select" id="spi-freq-select">
          <option value="1000000" selected>1.0 MHz (SCLK Speed)</option>
          <option value="5000000">5.0 MHz (High Speed)</option>
        </select>
      </div>

      <div class="config-row">
        <label for="spi-data-input">Master Data Byte (Hex)</label>
        <input type="text" class="control-input" id="spi-data-input" value="0xAA" maxlength="4" style="font-family:'JetBrains Mono',monospace;">
      </div>

      <div class="config-row">
        <label for="spi-order-select">Transmission Bit Shift Order</label>
        <select class="control-select" id="spi-order-select">
          <option value="msb" selected>MSB First (Standard shift)</option>
          <option value="lsb">LSB First (Reversed shift)</option>
        </select>
      </div>
    `;

    document.getElementById('spi-mode-select').addEventListener('change', () => this.reset());
    document.getElementById('spi-freq-select').addEventListener('change', () => this.reset());
    document.getElementById('spi-data-input').addEventListener('input', () => this.reset());
    document.getElementById('spi-order-select').addEventListener('change', () => this.reset());
  }

  loadFaultButtons() {
    errorContainer.innerHTML = `
      <button class="btn-error-inject" id="err-spi-cpol">CPOL Mismatch</button>
      <button class="btn-error-inject" id="err-spi-cpha">CPHA Mismatch</button>
      <button class="btn-error-inject" id="err-spi-glitch">Clock Glitch</button>
      <button class="btn-error-inject" id="err-spi-cs">CS Fault Line</button>
    `;

    const btnCpol = document.getElementById('err-spi-cpol');
    const btnCpha = document.getElementById('err-spi-cpha');
    const btnGlitch = document.getElementById('err-spi-glitch');
    const btnCs = document.getElementById('err-spi-cs');

    btnCpol.addEventListener('click', () => {
      this.activeErrors['cpol'] = !this.activeErrors['cpol'];
      btnCpol.classList.toggle('active', this.activeErrors['cpol']);
      this.stats.errors += this.activeErrors['cpol'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });

    btnCpha.addEventListener('click', () => {
      this.activeErrors['cpha'] = !this.activeErrors['cpha'];
      btnCpha.classList.toggle('active', this.activeErrors['cpha']);
      this.stats.errors += this.activeErrors['cpha'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });

    btnGlitch.addEventListener('click', () => {
      this.activeErrors['glitch'] = !this.activeErrors['glitch'];
      btnGlitch.classList.toggle('active', this.activeErrors['glitch']);
      this.stats.errors += this.activeErrors['glitch'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });

    btnCs.addEventListener('click', () => {
      this.activeErrors['cs'] = !this.activeErrors['cs'];
      btnCs.classList.toggle('active', this.activeErrors['cs']);
      this.stats.errors += this.activeErrors['cs'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });
  }

  loadSchematic() {
    schematicContainer.innerHTML = `
      <div style="display: flex; justify-content: space-around; align-items: center; width: 100%; height: 100%; padding: 15px;">
        <div class="node-chip master" id="spi-master" style="font-size:0.7rem;">SPI Master<br><span style="font-size:0.55rem; color:var(--text-muted);">MCU Host</span></div>
        
        <svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;">
          <!-- MOSI Wire -->
          <path id="mosi-wire" d="M 125 75 L 260 75 L 260 75 L 430 75" stroke="var(--accent-cyan)" stroke-width="2.5" fill="none" class="bus-wire"/>
          <!-- MISO Wire -->
          <path id="miso-wire" d="M 430 110 L 260 110 L 260 110 L 125 110" stroke="var(--accent-amber)" stroke-width="2.5" fill="none" class="bus-wire"/>
          <!-- SCLK Wire -->
          <path id="sclk-wire" d="M 125 145 L 260 145 L 260 145 L 430 145" stroke="var(--accent-indigo)" stroke-width="2.5" fill="none" class="bus-wire"/>
          <!-- CS Wire -->
          <path id="cs-wire" d="M 125 180 L 260 180 L 260 180 L 430 180" stroke="var(--accent-rose)" stroke-width="2.5" fill="none" class="bus-wire"/>
          
          <!-- Colored bubbles pulses shift -->
          <circle id="mosi-pulse" cx="125" cy="75" r="5" fill="var(--accent-cyan)" style="display:none; filter: drop-shadow(0 0 4px var(--accent-cyan));" />
          <circle id="miso-pulse" cx="430" cy="110" r="5" fill="var(--accent-amber)" style="display:none; filter: drop-shadow(0 0 4px var(--accent-amber));" />
        </svg>

        <div class="node-chip slave" id="spi-slave" style="font-size:0.7rem;">SPI Slave<br><span style="font-size:0.55rem; color:var(--text-muted);">MISO Response</span></div>
      </div>
    `;
    timingEngine.setChannels([
      { name: 'CS', color: 'var(--sig-cs)' },
      { name: 'SCLK', color: 'var(--sig-sclk)' },
      { name: 'MOSI', color: 'var(--sig-mosi)' },
      { name: 'MISO', color: 'var(--sig-miso)' }
    ]);
    timingEngine.draw([], -1);
  }

  generateTimeline() {
    const modeEl = document.getElementById('spi-mode-select');
    const spiMode = modeEl ? parseInt(modeEl.value) : 0;
    const dataInput = document.getElementById('spi-data-input');
    const dataStr = dataInput ? dataInput.value : '0xAA';
    const masterData = parseInt(dataStr, 16) || 0x00;
    const orderSelect = document.getElementById('spi-order-select');
    const bitOrder = orderSelect ? orderSelect.value : 'msb';
    const freqSelect = document.getElementById('spi-freq-select');
    const freq = freqSelect ? parseInt(freqSelect.value) : 1000000;

    // Dynamic MISO response byte: e.g. reversed value representing status acknowledge
    const slaveData = 0xAA;

    this.timeline = [];
    let time = 0.0;
    const period = freq === 1000000 ? 0.8 : 0.3; // Clock period

    // Determine CPOL & CPHA settings
    // Mode 0: CPOL=0, CPHA=0 (Idle SCLK=0, shift-on-falling, sample-on-rising)
    // Mode 1: CPOL=0, CPHA=1 (Idle SCLK=0, shift-on-rising, sample-on-falling)
    // Mode 2: CPOL=1, CPHA=0 (Idle SCLK=1, shift-on-rising, sample-on-falling)
    // Mode 3: CPOL=1, CPHA=1 (Idle SCLK=1, shift-on-falling, sample-on-rising)
    const cpol = (spiMode === 2 || spiMode === 3) ? 1 : 0;
    const cpha = (spiMode === 1 || spiMode === 3) ? 1 : 0;

    // Check CPOL mismatch error injection
    const actualCpol = this.activeErrors['cpol'] ? (1 - cpol) : cpol;
    const actualCpha = this.activeErrors['cpha'] ? (1 - cpha) : cpha;

    const masterEfficiency = (this.activeErrors['cpol'] || this.activeErrors['cpha'] || this.activeErrors['cs']) ? 0 : 96;
    const throughput = (this.activeErrors['cpol'] || this.activeErrors['cpha'] || this.activeErrors['cs']) ? 0 : Math.round(freq * 0.9);

    // 1. CS Line physical failure lock state
    if (this.activeErrors['cs']) {
      glitchAlert.style.display = 'block';
      for (let i = 0; i < 6; i++) {
        this.timeline.push({
          timestamp: time,
          channels: { CS: 1, SCLK: actualCpol, MOSI: 0, MISO: 1 },
          logEntry: i === 0 ? "⚠️ HARDWARE FAULT: CS Pin failed HIGH" : '',
          isErrorLog: true,
          explanation: "The Chip Select (CS) line remains HIGH indefinitely. The slave peripheral is never selected and its MISO pin remains in High-Impedance (Hi-Z), ignoring MOSI inputs.",
          statUpdate: { shifted: 0, throughput: 0, efficiency: 0, txTime: time }
        });
        time += period;
      }
      return;
    }

    glitchAlert.style.display = 'none';

    // 2. Idle State (CS High, SCLK idle level)
    this.timeline.push({
      timestamp: time,
      channels: { CS: 1, SCLK: actualCpol, MOSI: 0, MISO: 1 },
      logEntry: `SPI Mode ${spiMode} Idle state`,
      explanation: `SPI Bus Idle. SCLK sits at its configured Idle level (${actualCpol === 1 ? 'HIGH' : 'LOW'}) under Mode CPOL=${cpol}. CS is HIGH.`,
      statUpdate: { shifted: 0, throughput: 0, efficiency: masterEfficiency, errors: Object.keys(this.activeErrors).length, txTime: 0 }
    });
    time += period;

    // 3. Chip Select CS goes LOW
    this.timeline.push({
      timestamp: time,
      channels: { CS: 0, SCLK: actualCpol, MOSI: 0, MISO: 1 },
      logEntry: "CS Selected LOW",
      explanation: "Master pulls Chip Select (CS) LOW. The target SPI slave device wakes up and prepares MOSI/MISO transfer registers.",
      statUpdate: { txTime: time }
    });
    time += period;

    // 4. Bit-by-bit shifting loop (8 bits)
    let mosiBits = [];
    let misoBits = [];
    for (let i = 7; i >= 0; i--) {
      const idx = bitOrder === 'msb' ? i : (7 - i);
      mosiBits.push((masterData >> idx) & 1);
      misoBits.push((slaveData >> idx) & 1);
    }

    mosiBits.forEach((mBit, idx) => {
      const sBit = misoBits[idx];
      const sclkPulse1 = actualCpol === 1 ? 0 : 1; // toggled level
      const sclkPulse2 = actualCpol;             // back to idle level

      // Clock Phase sampling timing details
      // CPHA=0: sample on first clock edge, shift on second edge
      // CPHA=1: shift on first clock edge, sample on second edge
      const firstEdgeStr = actualCpol === 1 ? "Falling Edge" : "Rising Edge";
      const secondEdgeStr = actualCpol === 1 ? "Rising Edge" : "Falling Edge";

      // 4a. SCLK Transits to Toggle Pulse Level
      const hasGlitch = this.activeErrors['glitch'] && idx === 3;
      this.timeline.push({
        timestamp: time,
        channels: { CS: 0, SCLK: sclkPulse1, MOSI: mBit, MISO: sBit },
        logEntry: idx === 0 ? `Transmitting payload ${dataStr}` : (hasGlitch ? "⚠️ Clock Noise Glitch Injected!" : ''),
        isErrorLog: hasGlitch,
        explanation: hasGlitch
          ? "Spurious high-frequency noise spikes occurred on SCLK. The slave treats this glitch as a valid clock cycle, causing double clock samples and misalignment."
          : `SCLK transitions to ${sclkPulse1 === 1 ? 'HIGH' : 'LOW'} (first edge: ${firstEdgeStr}). ` +
            (actualCpha === 0 
              ? `CPHA=0: Slave samples MOSI bit (${mBit}) and Master samples MISO bit (${sBit}).`
              : `CPHA=1: Both Master and Slave shift next data bits on lines.`),
        statUpdate: { txTime: time, errors: this.activeErrors['glitch'] ? 1 : 0 }
      });
      time += period / 2;

      // 4b. SCLK Transits back to Idle Level
      this.timeline.push({
        timestamp: time,
        channels: { CS: 0, SCLK: sclkPulse2, MOSI: mBit, MISO: sBit },
        explanation: `SCLK transitions back to ${sclkPulse2 === 1 ? 'HIGH' : 'LOW'} (second edge: ${secondEdgeStr}). ` +
          (actualCpha === 0
            ? `CPHA=0: Both Master and Slave shift next data bits out onto lines.`
            : `CPHA=1: Slave samples MOSI bit (${mBit}) and Master samples MISO bit (${sBit}).`),
        statUpdate: { txTime: time }
      });
      time += period / 2;
    });

    // 5. Transfer finished, CS goes HIGH
    this.timeline.push({
      timestamp: time,
      channels: { CS: 0, SCLK: actualCpol, MOSI: 0, MISO: 1 },
      explanation: "Master completes shift cycles, SCLK clock operations stop.",
      statUpdate: { txTime: time }
    });
    time += period;

    this.timeline.push({
      timestamp: time,
      channels: { CS: 1, SCLK: actualCpol, MOSI: 0, MISO: 1 },
      logEntry: "CS De-selected HIGH",
      explanation: "Master pulls Chip Select (CS) HIGH. The slave's MISO buffer transitions back into high-impedance mode. Single-byte transaction complete.",
      statUpdate: { shifted: 1, throughput: throughput, efficiency: masterEfficiency, txTime: time }
    });
  }

  animateSchematic(step) {
    const mosiWire = document.getElementById('mosi-wire');
    const misoWire = document.getElementById('miso-wire');
    const sclkWire = document.getElementById('sclk-wire');
    const csWire = document.getElementById('cs-wire');

    const mosiPulse = document.getElementById('mosi-pulse');
    const misoPulse = document.getElementById('miso-pulse');

    const csVal = step.channels['CS'];
    const sclkVal = step.channels['SCLK'];
    const mosiVal = step.channels['MOSI'];
    const misoVal = step.channels['MISO'];

    // Update lines glowing classes
    mosiWire.style.stroke = mosiVal === 1 ? 'var(--accent-cyan)' : 'rgba(6, 182, 212, 0.2)';
    misoWire.style.stroke = misoVal === 1 ? 'var(--accent-amber)' : 'rgba(245, 158, 11, 0.2)';
    sclkWire.style.stroke = sclkVal === 1 ? 'var(--accent-indigo)' : 'rgba(99, 102, 241, 0.2)';
    csWire.style.stroke = csVal === 0 ? 'var(--accent-rose)' : 'rgba(244, 63, 94, 0.2)';

    // Pulse bubble shift motions
    if (this.isPlaying && csVal === 0) {
      mosiPulse.style.display = 'block';
      misoPulse.style.display = 'block';

      const progressPercent = (this.currentStep / this.timeline.length);
      const range = 430 - 125;

      mosiPulse.setAttribute('cx', 125 + range * progressPercent);
      misoPulse.setAttribute('cx', 430 - range * progressPercent); // miso flows slave to master

      mosiPulse.setAttribute('fill', mosiVal === 1 ? 'var(--accent-cyan)' : '#ef4444');
      misoPulse.setAttribute('fill', misoVal === 1 ? 'var(--accent-amber)' : '#ef4444');
    } else {
      mosiPulse.style.display = 'none';
      misoPulse.style.display = 'none';
    }

    if (step.isErrorLog) {
      document.getElementById('spi-slave').style.borderColor = 'var(--accent-rose)';
      document.getElementById('spi-slave').style.boxShadow = '0 0 20px var(--accent-rose-glow)';
      mosiWire.classList.add('glitch');
      sclkWire.classList.add('glitch');
    } else {
      document.getElementById('spi-slave').style.borderColor = 'var(--accent-emerald)';
      document.getElementById('spi-slave').style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.2)';
      mosiWire.classList.remove('glitch');
      sclkWire.classList.remove('glitch');
    }
  }
}

// ==========================================
// 7. UART SIMULATOR IMPLEMENTATION
// ==========================================
class UARTSimulator extends ProtocolSimulator {
  constructor() {
    super("UART");
    this.playbackDelay = 140;
  }

  loadConfig() {
    configContainer.innerHTML = `
      <div class="config-row">
        <label for="uart-baud-select">UART Transmit Baud Rate (Speed)</label>
        <select class="control-select" id="uart-baud-select">
          <option value="9600" selected>9600 bps (Standard Speed)</option>
          <option value="19200">19200 bps</option>
          <option value="57600">57600 bps</option>
          <option value="115200">115200 bps (High Speed)</option>
        </select>
      </div>

      <div class="config-row">
        <label for="uart-data-input">Character Payload (ASCII Char)</label>
        <input type="text" class="control-input" id="uart-data-input" value="M" maxlength="1" style="font-family:'JetBrains Mono',monospace; text-align:center; font-size:1.1rem; font-weight:bold; color:var(--accent-cyan);">
      </div>

      <div class="config-row">
        <label for="uart-parity-select">Parity Checking Bit</label>
        <select class="control-select" id="uart-parity-select">
          <option value="none" selected>None (No parity bit)</option>
          <option value="even">Even (Verify even bit parity)</option>
          <option value="odd">Odd (Verify odd bit parity)</option>
        </select>
      </div>

      <div class="config-row">
        <label for="uart-stop-select">Stop Frame Bits Size</label>
        <select class="control-select" id="uart-stop-select">
          <option value="1" selected>1 Stop Bit (Default)</option>
          <option value="2">2 Stop Bits</option>
        </select>
      </div>
    `;

    document.getElementById('uart-baud-select').addEventListener('change', () => this.reset());
    document.getElementById('uart-data-input').addEventListener('input', () => this.reset());
    document.getElementById('uart-parity-select').addEventListener('change', () => this.reset());
    document.getElementById('uart-stop-select').addEventListener('change', () => this.reset());
  }

  loadFaultButtons() {
    errorContainer.innerHTML = `
      <button class="btn-error-inject" id="err-uart-frame">Framing Error</button>
      <button class="btn-error-inject" id="err-uart-parity">Parity Error</button>
      <button class="btn-error-inject" id="err-uart-noise">Signal Noise</button>
      <button class="btn-error-inject" id="err-uart-overrun">Overrun Error</button>
    `;

    const btnFrame = document.getElementById('err-uart-frame');
    const btnParity = document.getElementById('err-uart-parity');
    const btnNoise = document.getElementById('err-uart-noise');
    const btnOverrun = document.getElementById('err-uart-overrun');

    btnFrame.addEventListener('click', () => {
      this.activeErrors['frame'] = !this.activeErrors['frame'];
      btnFrame.classList.toggle('active', this.activeErrors['frame']);
      this.stats.errors += this.activeErrors['frame'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });

    btnParity.addEventListener('click', () => {
      this.activeErrors['parity'] = !this.activeErrors['parity'];
      btnParity.classList.toggle('active', this.activeErrors['parity']);
      this.stats.errors += this.activeErrors['parity'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });

    btnNoise.addEventListener('click', () => {
      this.activeErrors['noise'] = !this.activeErrors['noise'];
      btnNoise.classList.toggle('active', this.activeErrors['noise']);
      this.stats.errors += this.activeErrors['noise'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });

    btnOverrun.addEventListener('click', () => {
      this.activeErrors['overrun'] = !this.activeErrors['overrun'];
      btnOverrun.classList.toggle('active', this.activeErrors['overrun']);
      this.stats.errors += this.activeErrors['overrun'] ? 1 : -1;
      this.syncUI();
      playTick(false);
      this.generateTimeline();
    });
  }

  loadSchematic() {
    schematicContainer.innerHTML = `
      <div style="display: flex; justify-content: space-around; align-items: center; width: 100%; height: 100%; padding: 20px;">
        <div class="node-chip master" id="uart-master">UART TX<br><span style="font-size:0.6rem; color:var(--text-muted);">Transmitter</span></div>
        
        <svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;">
          <!-- TX-RX Wire -->
          <path id="tx-wire" d="M 130 125 L 260 125 L 260 125 L 430 125" stroke="var(--accent-amber)" stroke-width="2.5" fill="none" class="bus-wire"/>
          
          <!-- Transmit bubble pulse -->
          <circle id="tx-pulse" cx="130" cy="125" r="5" fill="var(--accent-amber)" style="display:none; filter: drop-shadow(0 0 4px var(--accent-amber));" />
        </svg>

        <div class="node-chip slave" id="uart-slave">UART RX<br><span style="font-size:0.6rem; color:var(--text-muted);">Receiver</span></div>
      </div>
    `;
    timingEngine.setChannels([
      { name: 'TX_LINE', color: 'var(--sig-tx)' }
    ]);
    timingEngine.draw([], -1);
  }

  generateTimeline() {
    const baudSelect = document.getElementById('uart-baud-select');
    const baudRate = baudSelect ? parseInt(baudSelect.value) : 9600;
    const dataInput = document.getElementById('uart-data-input');
    const dataChar = dataInput ? (dataInput.value || 'M') : 'M';
    const charCode = dataChar.charCodeAt(0);
    const paritySelect = document.getElementById('uart-parity-select');
    const parityType = paritySelect ? paritySelect.value : 'none';
    const stopSelect = document.getElementById('uart-stop-select');
    const stopBitsCount = stopSelect ? parseInt(stopSelect.value) : 1;

    this.timeline = [];
    let time = 0.0;
    const bitPeriod = 1.0; // Normalized representation

    const efficiency = parityType === 'none' ? 80 : 72; // Data payload payload frame overhead percentage
    const throughput = Math.round(baudRate * (8 / (1 + 8 + (parityType === 'none' ? 0 : 1) + stopBitsCount)));

    // 1. Check Overrun Error injection pre-pass
    if (this.activeErrors['overrun']) {
      glitchAlert.style.display = 'block';
      for (let i = 0; i < 6; i++) {
        this.timeline.push({
          timestamp: time,
          channels: { TX_LINE: 0 },
          logEntry: i === 0 ? "⚠️ HARDWARE FAULT: Receiver Overrun Error!" : '',
          isErrorLog: true,
          explanation: "Receiver Overrun: A new byte was shifted in before the CPU Host read the previous byte from the hardware RX register buffer, causing hardware buffer overflow and data loss.",
          statUpdate: { shifted: 0, throughput: 0, efficiency: 0, txTime: time }
        });
        time += bitPeriod;
      }
      return;
    }

    glitchAlert.style.display = 'none';

    // 2. IDLE State (Line sits High)
    this.timeline.push({
      timestamp: time,
      channels: { TX_LINE: 1 },
      logEntry: "UART Tx Line IDLE",
      explanation: "In asynchronous serial communication, UART lines default to HIGH (Idle Mark level) when no data is being transmitted.",
      statUpdate: { shifted: 0, throughput: 0, efficiency: efficiency, errors: Object.keys(this.activeErrors).length, txTime: 0 }
    });
    time += bitPeriod;

    // 3. START Bit (Line goes Low)
    this.timeline.push({
      timestamp: time,
      channels: { TX_LINE: 0 },
      logEntry: "START Bit Detected",
      explanation: "A START bit (logic level LOW / Space) is transmitted to signal the receiver to synchronize its internal clock and start counting bits.",
      statUpdate: { txTime: time }
    });
    time += bitPeriod;

    // 4. Data Payload bits (8 bits, LSB first)
    let bits = [];
    let oneBitsCount = 0;
    for (let i = 0; i < 8; i++) {
      const bit = (charCode >> i) & 1;
      bits.push(bit);
      if (bit === 1) oneBitsCount++;
    }

    bits.forEach((bit, idx) => {
      // check noise glitch inject
      const hasNoise = this.activeErrors['noise'] && idx === 4;
      
      this.timeline.push({
        timestamp: time,
        channels: { TX_LINE: hasNoise ? 0 : bit },
        logEntry: idx === 0 ? `Transmitting char '${dataChar}' (Hex: 0x${charCode.toString(16).toUpperCase()})` : (hasNoise ? "⚠️ Signal Noise distortion detected!" : ''),
        isErrorLog: hasNoise,
        explanation: hasNoise
          ? "Electrical EMI noise spikes corrupted the logic level during sampling. The UART receiver will read incorrect data values."
          : `UART shifts Data Bit ${idx} (${bit}) out onto transmission line (LSB First).`,
        statUpdate: { txTime: time, errors: this.activeErrors['noise'] ? 1 : 0 }
      });
      time += bitPeriod;
    });

    // 5. Parity Bit computation
    if (parityType !== 'none') {
      let parityBit = 0;
      if (parityType === 'even') {
        parityBit = (oneBitsCount % 2 === 0) ? 0 : 1;
      } else { // odd
        parityBit = (oneBitsCount % 2 !== 0) ? 0 : 1;
      }

      const forceParityError = this.activeErrors['parity'];
      const actualParity = forceParityError ? (1 - parityBit) : parityBit;

      this.timeline.push({
        timestamp: time,
        channels: { TX_LINE: actualParity },
        logEntry: forceParityError ? "⚠️ ERROR: Mismatched Parity Bit!" : `Parity Bit Transmitted (${actualParity})`,
        isErrorLog: forceParityError,
        explanation: forceParityError
          ? "Hardware parity check failed! The receiver calculated an even parity bit, but received an odd bit, indicating 1-bit frame corruption."
          : `UART transmits calculated Parity Bit (${actualParity}) under ${parityType.toUpperCase()} mode.`,
        statUpdate: { txTime: time, errors: this.activeErrors['parity'] ? 1 : 0 }
      });
      time += bitPeriod;
    }

    // 6. STOP Bits (Line returns HIGH)
    const forceFrameError = this.activeErrors['frame'];
    const stopBitVal = forceFrameError ? 0 : 1;

    for (let i = 1; i <= stopBitsCount; i++) {
      this.timeline.push({
        timestamp: time,
        channels: { TX_LINE: stopBitVal },
        logEntry: forceFrameError ? "⚠️ ERROR: UART Framing Error!" : `Stop Bit ${i} Sent`,
        isErrorLog: forceFrameError,
        explanation: forceFrameError
          ? "Framing Error: The receiver sampled the line during the expected STOP bit interval but found a LOW logic level instead of HIGH. Data frame alignment is corrupted."
          : `UART asserts Stop Bit ${i} (HIGH / Mark level) to terminate active character frame.`,
        statUpdate: { shifted: forceFrameError ? 0 : 1, throughput: forceFrameError ? 0 : throughput, efficiency: forceFrameError ? 0 : efficiency, txTime: time, errors: this.activeErrors['frame'] ? 1 : 0 }
      });
      time += bitPeriod;
    }

    // 7. Back to IDLE
    if (!forceFrameError) {
      this.timeline.push({
        timestamp: time,
        channels: { TX_LINE: 1 },
        logEntry: `Decoded ASCII output: '${dataChar}'`,
        explanation: "Frame fully processed. The asynchronous receiver buffers the character and shifts the UART line back to idle HIGH state.",
        statUpdate: { txTime: time }
      });
    }
  }

  animateSchematic(step) {
    const txWire = document.getElementById('tx-wire');
    const txPulse = document.getElementById('tx-pulse');
    const txVal = step.channels['TX_LINE'];

    // Update lines glowing status
    txWire.style.stroke = txVal === 1 ? 'var(--accent-amber)' : 'rgba(245, 158, 11, 0.2)';

    // Pulse flow bubble motion
    if (this.isPlaying) {
      txPulse.style.display = 'block';

      const progressPercent = (this.currentStep / this.timeline.length);
      const range = 430 - 130;

      txPulse.setAttribute('cx', 130 + range * progressPercent);
      txPulse.setAttribute('fill', txVal === 1 ? 'var(--accent-amber)' : '#ef4444');
    } else {
      txPulse.style.display = 'none';
    }

    if (step.isErrorLog) {
      document.getElementById('uart-slave').style.borderColor = 'var(--accent-rose)';
      document.getElementById('uart-slave').style.boxShadow = '0 0 20px var(--accent-rose-glow)';
      txWire.classList.add('glitch');
    } else {
      document.getElementById('uart-slave').style.borderColor = 'var(--accent-emerald)';
      document.getElementById('uart-slave').style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.2)';
      txWire.classList.remove('glitch');
    }
  }
}

// ==========================================
// 8. CONTROLLER & INSTANCES INITS
// ==========================================
const simulators = {
  i2c: new I2CSimulator(),
  spi: new SPISimulator(),
  uart: new UARTSimulator()
};
let activeProtocol = 'i2c';

function switchProtocol(protocolKey) {
  if (simulators[activeProtocol]) {
    simulators[activeProtocol].pause();
  }
  
  activeProtocol = protocolKey;
  const sim = simulators[activeProtocol];
  sim.loadConfig();
  sim.loadSchematic();
  sim.reset();

  // Add initial logs
  logger.log(0, `PROTOCOL.OS loaded active standard: ${protocolKey.toUpperCase()}`, '', false);
  learningContent.innerHTML = `
    <h4 style="color:var(--accent-cyan); margin-bottom:8px; font-family:'Orbitron',sans-serif;">${protocolKey.toUpperCase()} SIMULATION ENVIRONMENT</h4>
    <p>Select configurations at the sidebar parameters pane, configure injected hardware faults, and click <strong>Run</strong> to inspect high-speed bit transmissions.</p>
  `;
}

// Register Header Dropdown Switch
protocolSelect.addEventListener('change', (e) => {
  switchProtocol(e.target.value);
});

// Play / Pause / Reset button listeners
btnPlayPause.addEventListener('click', () => {
  const sim = simulators[activeProtocol];
  if (sim.isPlaying) {
    sim.pause();
  } else {
    sim.start();
  }
});

btnStepPrev.addEventListener('click', () => {
  simulators[activeProtocol].stepBackward();
});

btnStepNext.addEventListener('click', () => {
  simulators[activeProtocol].stepForward();
});

btnReset.addEventListener('click', () => {
  simulators[activeProtocol].reset();
});

// Zoom triggers
btnZoomIn.addEventListener('click', () => timingEngine.zoomIn());
btnZoomOut.addEventListener('click', () => timingEngine.zoomOut());

// Keyboard shortcuts for debugger step-arrows
window.addEventListener('keydown', (e) => {
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;

  if (e.key === ' ') {
    e.preventDefault();
    btnPlayPause.click();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    btnStepPrev.click();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    btnStepNext.click();
  } else if (e.key === 'r' || e.key === 'R') {
    btnReset.click();
  }
});

// Modal Toggles comparison
btnToggleComparison.addEventListener('click', () => {
  comparisonModal.classList.add('active');
  playTick(true);
});

document.querySelectorAll('.btn-modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    comparisonModal.classList.remove('active');
    playTick(false);
  });
});

// Export Logs downloader
btnExportLogs.addEventListener('click', () => {
  logger.exportLogs();
  playTick(true);
});

// Save & Load serialized state sessions
btnSaveSession.addEventListener('click', () => {
  const sim = simulators[activeProtocol];
  const state = {
    protocol: activeProtocol,
    config: {},
    errors: sim.activeErrors
  };
  
  // Grab current inputs
  if (activeProtocol === 'i2c') {
    state.config.slave = document.getElementById('i2c-slave-select').value;
    state.config.speed = document.getElementById('i2c-speed-select').value;
    state.config.data = document.getElementById('i2c-data-input').value;
    state.config.mode = document.getElementById('i2c-mode-select').value;
  } else if (activeProtocol === 'spi') {
    state.config.mode = document.getElementById('spi-mode-select').value;
    state.config.freq = document.getElementById('spi-freq-select').value;
    state.config.data = document.getElementById('spi-data-input').value;
    state.config.order = document.getElementById('spi-order-select').value;
  } else if (activeProtocol === 'uart') {
    state.config.baud = document.getElementById('uart-baud-select').value;
    state.config.data = document.getElementById('uart-data-input').value;
    state.config.parity = document.getElementById('uart-parity-select').value;
    state.config.stop = document.getElementById('uart-stop-select').value;
  }

  localStorage.setItem('protocol_os_session', JSON.stringify(state));
  alert("Active simulation session configuration successfully saved!");
  playTick(true);
});

btnLoadSession.addEventListener('click', () => {
  const data = localStorage.getItem('protocol_os_session');
  if (!data) {
    alert("No saved simulation session found in browser cache storage.");
    return;
  }

  const state = JSON.parse(data);
  protocolSelect.value = state.protocol;
  switchProtocol(state.protocol);

  setTimeout(() => {
    // Restore inputs
    if (state.protocol === 'i2c') {
      document.getElementById('i2c-slave-select').value = state.config.slave;
      document.getElementById('i2c-speed-select').value = state.config.speed;
      document.getElementById('i2c-data-input').value = state.config.data;
      document.getElementById('i2c-mode-select').value = state.config.mode;
    } else if (state.protocol === 'spi') {
      document.getElementById('spi-mode-select').value = state.config.mode;
      document.getElementById('spi-freq-select').value = state.config.freq;
      document.getElementById('spi-data-input').value = state.config.data;
      document.getElementById('spi-order-select').value = state.config.order;
    } else if (state.protocol === 'uart') {
      document.getElementById('uart-baud-select').value = state.config.baud;
      document.getElementById('uart-data-input').value = state.config.data;
      document.getElementById('uart-parity-select').value = state.config.parity;
      document.getElementById('uart-stop-select').value = state.config.stop;
    }

    const sim = simulators[state.protocol];
    sim.activeErrors = state.errors || {};
    sim.generateTimeline();
    sim.syncUI();
    alert("Simulation session state successfully loaded!");
    playTick(true);
  }, 100);
});

// Initialize on page load
window.addEventListener('load', () => {
  switchProtocol('i2c');
});
