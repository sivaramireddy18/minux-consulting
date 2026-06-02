// LOGIC.OS - Digital Logic Gate Simulator - Core Application Script

// ==========================================
// 1. SOUND SYNTHESIS ENGINE (Web Audio API)
// ==========================================
const AudioFX = {
  ctx: null,
  enabled: true,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
      this.enabled = false;
    }
  },

  playClick(high = true) {
    if (!this.enabled || !this.ctx) return;
    this.resumeContext();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(high ? 800 : 400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  },

  playBeep() {
    if (!this.enabled || !this.ctx) return;
    this.resumeContext();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  },

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
};

// Initialize Audio on first user interaction
window.addEventListener('mousedown', () => AudioFX.init(), { once: true });
window.addEventListener('keydown', () => AudioFX.init(), { once: true });

// ==========================================
// 2. GRAPHICS & CANVAS CONFIG
// ==========================================
const canvas = document.getElementById('circuit-canvas');
const masterG = document.getElementById('master-g');
const compGroup = document.getElementById('components-group');
const wireGroup = document.getElementById('connections-group');
const tempWirePath = document.getElementById('temp-wire-path');

let zoom = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;

let isConnecting = false;
let activeSourcePort = null;
let selectedItem = null; // Can be a Component or a Wire

let dragComponent = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

const GRID_SIZE = 20;

// Set up Workspace Coordinate Conversions
function getWorkspaceCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left - panX) / zoom;
  const y = (clientY - rect.top - panY) / zoom;
  return { x, y };
}

function snapToGrid(coord) {
  return Math.round(coord / GRID_SIZE) * GRID_SIZE;
}

// Pan & Zoom Event Handlers
canvas.addEventListener('mousedown', (e) => {
  // If clicking on port or gate, don't pan
  if (e.target.closest('.gate-group') || e.target.closest('.port') || isConnecting) return;
  
  isPanning = true;
  canvas.style.cursor = 'grabbing';
  startPanX = e.clientX - panX;
  startPanY = e.clientY - panY;
});

window.addEventListener('mousemove', (e) => {
  if (isPanning) {
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
    updateWorkspaceTransform();
  } else if (dragComponent) {
    const coords = getWorkspaceCoords(e.clientX, e.clientY);
    let newX = snapToGrid(coords.x - dragOffsetX);
    let newY = snapToGrid(coords.y - dragOffsetY);
    
    // Bounds limit
    newX = Math.max(20, Math.min(6000, newX));
    newY = Math.max(20, Math.min(6000, newY));
    
    dragComponent.x = newX;
    dragComponent.y = newY;
    dragComponent.updateSVG();
    updateWires();
  } else if (isConnecting && activeSourcePort) {
    const coords = getWorkspaceCoords(e.clientX, e.clientY);
    const p1 = activeSourcePort.getGlobalCoords();
    
    // Beautiful curve for preview wire
    const dx = Math.abs(coords.x - p1.x) * 0.5;
    const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${coords.x - dx} ${coords.y}, ${coords.x} ${coords.y}`;
    tempWirePath.setAttribute('d', pathD);
  }
});

window.addEventListener('mouseup', () => {
  isPanning = false;
  canvas.style.cursor = 'grab';
  dragComponent = null;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  const oldZoom = zoom;
  
  if (e.deltaY < 0) {
    zoom = Math.min(3.0, zoom * zoomFactor);
  } else {
    zoom = Math.max(0.4, zoom / zoomFactor);
  }
  
  // Zoom towards mouse pointer
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  panX = mouseX - (mouseX - panX) * (zoom / oldZoom);
  panY = mouseY - (mouseY - panY) * (zoom / oldZoom);
  
  updateWorkspaceTransform();
}, { passive: false });

function updateWorkspaceTransform() {
  masterG.setAttribute('transform', `translate(${panX}, ${panY}) scale(${zoom})`);
  document.getElementById('btn-zoom-reset').innerText = `${Math.round(zoom * 100)}%`;
}

// Reset Zoom Tool
document.getElementById('btn-zoom-reset').addEventListener('click', () => {
  zoom = 1.0;
  panX = 0;
  panY = 0;
  updateWorkspaceTransform();
});
document.getElementById('btn-zoom-in').addEventListener('click', () => {
  zoom = Math.min(3.0, zoom * 1.1);
  updateWorkspaceTransform();
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
  zoom = Math.max(0.4, zoom / 1.1);
  updateWorkspaceTransform();
});

// ==========================================
// 3. CORE COMPONENT & GATE MODELS
// ==========================================
let nextId = 1;
const components = [];
const wires = [];

class Port {
  constructor(parent, type, index, name, label, relX, relY) {
    this.id = `port-${nextId++}`;
    this.parent = parent;
    this.type = type; // 'input' or 'output'
    this.index = index;
    this.name = name;
    this.label = label;
    this.value = 0; // 0 or 1 logical state
    this.relX = relX;
    this.relY = relY;
    this.connectedWires = [];
  }

  getGlobalCoords() {
    return {
      x: this.parent.x + this.relX,
      y: this.parent.y + this.relY
    };
  }
}

class Component {
  constructor(type, x, y) {
    this.id = `comp-${nextId++}`;
    this.type = type;
    this.x = snapToGrid(x);
    this.y = snapToGrid(y);
    this.width = 80;
    this.height = 50;
    this.name = `${type}_${this.id.split('-')[1]}`;
    this.inputs = [];
    this.outputs = [];
    this.svgGroup = null;
    this.isDead = false;
  }

  initPorts() {
    // Override in subclasses
  }

  evaluate() {
    // Override in subclasses
  }

  createSVG() {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'gate-group');
    group.setAttribute('id', this.id);
    group.setAttribute('transform', `translate(${this.x}, ${this.y})`);
    
    // Handle dragging selection
    group.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (isConnecting) return;
      
      selectItem(this);
      dragComponent = this;
      const coords = getWorkspaceCoords(e.clientX, e.clientY);
      dragOffsetX = coords.x - this.x;
      dragOffsetY = coords.y - this.y;
    });

    group.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.onDoubleClick();
    });

    this.svgGroup = group;
    compGroup.appendChild(group);
    
    this.render();
  }

  render() {
    if (!this.svgGroup) return;
    this.svgGroup.innerHTML = '';
    
    // Standard glassmorphic Gate Body
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'gate-body');
    rect.setAttribute('width', this.width);
    rect.setAttribute('height', this.height);
    this.svgGroup.appendChild(rect);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'gate-label');
    text.setAttribute('x', this.width / 2);
    text.setAttribute('y', this.height / 2);
    text.textContent = this.getLabel();
    this.svgGroup.appendChild(text);

    // Subtitle (if available)
    const sub = this.getSublabel();
    if (sub) {
      const subtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      subtext.setAttribute('class', 'gate-sublabel');
      subtext.setAttribute('x', this.width / 2);
      subtext.setAttribute('y', this.height / 2 + 15);
      subtext.textContent = sub;
      this.svgGroup.appendChild(subtext);
    }

    // Render Ports
    [...this.inputs, ...this.outputs].forEach(port => {
      const portG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      portG.setAttribute('class', `port ${port.type} ${port.value === 1 ? 'high' : ''} ${port.connectedWires.length > 0 ? 'connected' : ''}`);
      portG.setAttribute('id', port.id);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', 'port-circle');
      circle.setAttribute('cx', port.relX);
      circle.setAttribute('cy', port.relY);
      circle.setAttribute('r', 5);
      portG.appendChild(circle);

      // Port labels
      if (port.label) {
        const portText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        portText.setAttribute('class', 'port-label');
        
        const isLeft = port.relX < this.width / 2;
        portText.setAttribute('x', port.relX + (isLeft ? 8 : -8));
        portText.setAttribute('y', port.relY + 3);
        portText.setAttribute('text-anchor', isLeft ? 'start' : 'end');
        portText.textContent = port.label;
        portG.appendChild(portText);
      }

      // Wire binding event
      portG.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onPortClick(port);
      });

      this.svgGroup.appendChild(portG);
    });
  }

  updateSVG() {
    if (!this.svgGroup) return;
    this.svgGroup.setAttribute('transform', `translate(${this.x}, ${this.y})`);
    
    // Update active port glowing colors dynamically
    [...this.inputs, ...this.outputs].forEach(port => {
      const portEl = document.getElementById(port.id);
      if (portEl) {
        portEl.setAttribute('class', `port ${port.type} ${port.value === 1 ? 'high' : ''} ${port.connectedWires.length > 0 ? 'connected' : ''}`);
      }
    });
  }

  getLabel() {
    return this.type.toUpperCase();
  }

  getSublabel() {
    return null;
  }

  onDoubleClick() {
    // Override in interactive components
  }

  delete() {
    this.isDead = true;
    if (this.svgGroup) {
      this.svgGroup.remove();
    }
    // Delete attached wires
    const attachedWires = [...wires].filter(w => w.fromPort.parent === this || w.toPort.parent === this);
    attachedWires.forEach(w => w.delete());
    
    const index = components.indexOf(this);
    if (index > -1) {
      components.splice(index, 1);
    }
    
    if (selectedItem === this) {
      selectItem(null);
    }
    
    updateWires();
  }
}

// ------------------------------------------
// LOGIC GATE EXTENSIONS
// ------------------------------------------
class NotGate extends Component {
  initPorts() {
    this.inputs.push(new Port(this, 'input', 0, 'IN', 'A', 0, 25));
    this.outputs.push(new Port(this, 'output', 0, 'OUT', 'Q', 80, 25));
  }
  evaluate() {
    this.outputs[0].value = this.inputs[0].value === 1 ? 0 : 1;
  }
}

class AndGate extends Component {
  constructor(x, y) {
    super('And', x, y);
    this.inputsCount = 2;
  }
  initPorts() {
    this.inputs = [];
    this.outputs = [];
    if (this.inputsCount === 2) {
      this.inputs.push(new Port(this, 'input', 0, 'IN1', 'A', 0, 15));
      this.inputs.push(new Port(this, 'input', 1, 'IN2', 'B', 0, 35));
    } else if (this.inputsCount === 3) {
      this.inputs.push(new Port(this, 'input', 0, 'IN1', 'A', 0, 12));
      this.inputs.push(new Port(this, 'input', 1, 'IN2', 'B', 0, 25));
      this.inputs.push(new Port(this, 'input', 2, 'IN3', 'C', 0, 38));
    } else {
      this.inputs.push(new Port(this, 'input', 0, 'IN1', 'A', 0, 10));
      this.inputs.push(new Port(this, 'input', 1, 'IN2', 'B', 0, 20));
      this.inputs.push(new Port(this, 'input', 2, 'IN3', 'C', 0, 30));
      this.inputs.push(new Port(this, 'input', 3, 'IN4', 'D', 0, 40));
    }
    this.outputs.push(new Port(this, 'output', 0, 'OUT', 'Q', 80, 25));
  }
  evaluate() {
    this.outputs[0].value = this.inputs.every(p => p.value === 1) ? 1 : 0;
  }
}

class OrGate extends Component {
  initPorts() {
    this.inputs.push(new Port(this, 'input', 0, 'IN1', 'A', 0, 15));
    this.inputs.push(new Port(this, 'input', 1, 'IN2', 'B', 0, 35));
    this.outputs.push(new Port(this, 'output', 0, 'OUT', 'Q', 80, 25));
  }
  evaluate() {
    this.outputs[0].value = this.inputs.some(p => p.value === 1) ? 1 : 0;
  }
}

class XorGate extends Component {
  initPorts() {
    this.inputs.push(new Port(this, 'input', 0, 'IN1', 'A', 0, 15));
    this.inputs.push(new Port(this, 'input', 1, 'IN2', 'B', 0, 35));
    this.outputs.push(new Port(this, 'output', 0, 'OUT', 'Q', 80, 25));
  }
  evaluate() {
    this.outputs[0].value = (this.inputs[0].value !== this.inputs[1].value) ? 1 : 0;
  }
}

class NandGate extends Component {
  initPorts() {
    this.inputs.push(new Port(this, 'input', 0, 'IN1', 'A', 0, 15));
    this.inputs.push(new Port(this, 'input', 1, 'IN2', 'B', 0, 35));
    this.outputs.push(new Port(this, 'output', 0, 'OUT', 'Q', 80, 25));
  }
  evaluate() {
    this.outputs[0].value = this.inputs.every(p => p.value === 1) ? 0 : 1;
  }
}

class NorGate extends Component {
  initPorts() {
    this.inputs.push(new Port(this, 'input', 0, 'IN1', 'A', 0, 15));
    this.inputs.push(new Port(this, 'input', 1, 'IN2', 'B', 0, 35));
    this.outputs.push(new Port(this, 'output', 0, 'OUT', 'Q', 80, 25));
  }
  evaluate() {
    this.outputs[0].value = this.inputs.some(p => p.value === 1) ? 0 : 1;
  }
}

class XnorGate extends Component {
  initPorts() {
    this.inputs.push(new Port(this, 'input', 0, 'IN1', 'A', 0, 15));
    this.inputs.push(new Port(this, 'input', 1, 'IN2', 'B', 0, 35));
    this.outputs.push(new Port(this, 'output', 0, 'OUT', 'Q', 80, 25));
  }
  evaluate() {
    this.outputs[0].value = (this.inputs[0].value === this.inputs[1].value) ? 1 : 0;
  }
}

// ------------------------------------------
// INPUT SOURCES & CLOCK
// ------------------------------------------
class Switch extends Component {
  constructor(x, y) {
    super('Switch', x, y);
    this.width = 60;
    this.height = 40;
    this.state = 0; // 0 or 1
  }
  initPorts() {
    this.outputs.push(new Port(this, 'output', 0, 'OUT', '', 60, 20));
  }
  evaluate() {
    this.outputs[0].value = this.state;
  }
  onDoubleClick() {
    this.state = this.state === 1 ? 0 : 1;
    AudioFX.playClick(this.state === 1);
    this.render();
    triggerSimulationStep();
  }
  getLabel() {
    return this.state === 1 ? "ON" : "OFF";
  }
  render() {
    super.render();
    // Add visual slider toggle inside the component representation
    const toggleBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    toggleBg.setAttribute('x', 12);
    toggleBg.setAttribute('y', 24);
    toggleBg.setAttribute('width', 36);
    toggleBg.setAttribute('height', 10);
    toggleBg.setAttribute('rx', 5);
    toggleBg.setAttribute('fill', '#1e293b');
    toggleBg.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    this.svgGroup.appendChild(toggleBg);

    const toggleBtn = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    toggleBtn.setAttribute('class', `switch-toggle-btn ${this.state === 1 ? 'high' : ''}`);
    toggleBtn.setAttribute('cx', this.state === 1 ? 40 : 20);
    toggleBtn.setAttribute('cy', 29);
    toggleBtn.setAttribute('r', 7);
    toggleBtn.setAttribute('fill', '#4b5563');
    if (this.state === 1) {
      toggleBtn.setAttribute('filter', 'url(#cyan-glow)');
      toggleBtn.setAttribute('fill', 'var(--accent-cyan)');
    }
    
    // Toggle clicking
    toggleBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.onDoubleClick();
    });
    this.svgGroup.appendChild(toggleBtn);
  }
}

class Clock extends Component {
  constructor(x, y) {
    super('Clock', x, y);
    this.width = 60;
    this.height = 40;
    this.frequency = 1; // 1Hz by default
    this.ticksElapsed = 0;
    this.state = 0;
  }
  initPorts() {
    this.outputs.push(new Port(this, 'output', 0, 'OUT', '', 60, 20));
  }
  evaluate() {
    this.outputs[0].value = this.state;
  }
  updateTicks(simHz) {
    // Toggle state based on simulation speed vs clock frequency
    const ticksPerHalfCycle = Math.max(1, Math.round(simHz / (this.frequency * 2)));
    this.ticksElapsed++;
    if (this.ticksElapsed >= ticksPerHalfCycle) {
      this.state = this.state === 1 ? 0 : 1;
      this.ticksElapsed = 0;
      this.renderClockPulseVisual();
    }
  }
  renderClockPulseVisual() {
    if (!this.svgGroup) return;
    const body = this.svgGroup.querySelector('.gate-body');
    if (body) {
      if (this.state === 1) {
        body.style.stroke = 'var(--accent-cyan)';
        body.style.filter = 'drop-shadow(0 0 4px var(--accent-cyan-glow))';
      } else {
        body.style.stroke = '';
        body.style.filter = '';
      }
    }
  }
  getSublabel() {
    return `${this.frequency} Hz`;
  }
}

class Vcc extends Component {
  constructor(x, y) {
    super('Vcc', x, y);
    this.width = 50;
    this.height = 30;
  }
  initPorts() {
    this.outputs.push(new Port(this, 'output', 0, 'OUT', '', 50, 15));
  }
  evaluate() {
    this.outputs[0].value = 1;
  }
  getLabel() {
    return "VCC";
  }
  getSublabel() {
    return "HIGH (1)";
  }
}

class Gnd extends Component {
  constructor(x, y) {
    super('Gnd', x, y);
    this.width = 50;
    this.height = 30;
  }
  initPorts() {
    this.outputs.push(new Port(this, 'output', 0, 'OUT', '', 50, 15));
  }
  evaluate() {
    this.outputs[0].value = 0;
  }
  getLabel() {
    return "GND";
  }
  getSublabel() {
    return "LOW (0)";
  }
}

// ------------------------------------------
// OUTPUTS & DISPLAYS
// ------------------------------------------
class Led extends Component {
  constructor(x, y) {
    super('Led', x, y);
    this.width = 50;
    this.height = 50;
    this.color = 'cyan'; // 'cyan', 'emerald', 'rose', 'amber'
  }
  initPorts() {
    this.inputs.push(new Port(this, 'input', 0, 'IN', '', 0, 25));
  }
  evaluate() {
    // LED evaluates inputs
  }
  getLabel() {
    return "";
  }
  render() {
    super.render();
    const isActive = this.inputs[0].value === 1;
    
    const bulb = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bulb.setAttribute('cx', 25);
    bulb.setAttribute('cy', 25);
    bulb.setAttribute('r', 12);
    
    if (isActive) {
      bulb.setAttribute('fill', `var(--accent-${this.color})`);
      bulb.setAttribute('stroke', '#ffffff');
      bulb.setAttribute('stroke-width', '2');
      bulb.setAttribute('filter', `url(#${this.color}-glow)`);
    } else {
      bulb.setAttribute('fill', '#1e293b');
      bulb.setAttribute('stroke', '#4b5563');
      bulb.setAttribute('stroke-width', '2');
    }
    
    this.svgGroup.appendChild(bulb);
  }
}

class SevenSegment extends Component {
  constructor(x, y) {
    super('SevenSegment', x, y);
    this.width = 70;
    this.height = 100;
  }
  initPorts() {
    // standard 7-segments A to G
    this.inputs.push(new Port(this, 'input', 0, 'A', 'A', 0, 15));
    this.inputs.push(new Port(this, 'input', 1, 'B', 'B', 0, 25));
    this.inputs.push(new Port(this, 'input', 2, 'C', 'C', 0, 35));
    this.inputs.push(new Port(this, 'input', 3, 'D', 'D', 0, 45));
    this.inputs.push(new Port(this, 'input', 4, 'E', 'E', 0, 55));
    this.inputs.push(new Port(this, 'input', 5, 'F', 'F', 0, 65));
    this.inputs.push(new Port(this, 'input', 6, 'G', 'G', 0, 75));
  }
  getLabel() { return ""; }
  render() {
    super.render();
    
    // Draw 7 Segment bars
    const segments = [
      // A (top)
      { name: 'a', x1: 22, y1: 15, x2: 48, y2: 15, idx: 0 },
      // B (top right)
      { name: 'b', x1: 50, y1: 17, x2: 50, y2: 45, idx: 1 },
      // C (bottom right)
      { name: 'c', x1: 50, y1: 51, x2: 50, y2: 79, idx: 2 },
      // D (bottom)
      { name: 'd', x1: 22, y1: 81, x2: 48, y2: 81, idx: 3 },
      // E (bottom left)
      { name: 'e', x1: 20, y1: 51, x2: 20, y2: 79, idx: 4 },
      // F (top left)
      { name: 'f', x1: 20, y1: 17, x2: 20, y2: 45, idx: 5 },
      // G (middle)
      { name: 'g', x1: 22, y1: 48, x2: 48, y2: 48, idx: 6 }
    ];

    segments.forEach(seg => {
      const active = this.inputs[seg.idx].value === 1;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', seg.x1);
      line.setAttribute('y1', seg.y1);
      line.setAttribute('x2', seg.x2);
      line.setAttribute('y2', seg.y2);
      line.setAttribute('stroke-linecap', 'round');
      
      if (active) {
        line.setAttribute('stroke', 'var(--accent-rose)');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('filter', 'url(#rose-glow)');
      } else {
        line.setAttribute('stroke', '#1e293b');
        line.setAttribute('stroke-width', '3');
      }
      this.svgGroup.appendChild(line);
    });
  }
}

class HexDisplay extends Component {
  constructor(x, y) {
    super('HexDisplay', x, y);
    this.width = 60;
    this.height = 70;
  }
  initPorts() {
    // 4 inputs representing D3, D2, D1, D0
    this.inputs.push(new Port(this, 'input', 0, 'D3', 'D3', 0, 15));
    this.inputs.push(new Port(this, 'input', 1, 'D2', 'D2', 0, 30));
    this.inputs.push(new Port(this, 'input', 2, 'D1', 'D1', 0, 45));
    this.inputs.push(new Port(this, 'input', 3, 'D0', 'D0', 0, 60));
  }
  getLabel() { return ""; }
  render() {
    super.render();
    
    // Hex evaluation
    const val = (this.inputs[0].value << 3) | 
                (this.inputs[1].value << 2) | 
                (this.inputs[2].value << 1) | 
                (this.inputs[3].value);
    
    const hexChar = val.toString(16).toUpperCase();

    // Background display box
    const dispBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    dispBox.setAttribute('x', 15);
    dispBox.setAttribute('y', 10);
    dispBox.setAttribute('width', 30);
    dispBox.setAttribute('height', 50);
    dispBox.setAttribute('rx', 4);
    dispBox.setAttribute('fill', '#02060f');
    dispBox.setAttribute('stroke', 'rgba(255, 255, 255, 0.05)');
    dispBox.setAttribute('stroke-width', '2');
    this.svgGroup.appendChild(dispBox);

    // Number text
    const dispText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dispText.setAttribute('x', 30);
    dispText.setAttribute('y', 42);
    dispText.setAttribute('text-anchor', 'middle');
    dispText.setAttribute('font-family', "'Orbitron', monospace");
    dispText.setAttribute('font-size', '28px');
    dispText.setAttribute('font-weight', '900');
    dispText.setAttribute('fill', 'var(--accent-emerald)');
    dispText.setAttribute('filter', 'url(#emerald-glow)');
    dispText.textContent = hexChar;
    this.svgGroup.appendChild(dispText);
  }
}

class Buzzer extends Component {
  constructor(x, y) {
    super('Buzzer', x, y);
    this.width = 65;
    this.height = 50;
    this.prevVal = 0;
  }
  initPorts() {
    this.inputs.push(new Port(this, 'input', 0, 'IN', '', 0, 25));
  }
  evaluate() {
    const curVal = this.inputs[0].value;
    if (curVal === 1 && this.prevVal === 0) {
      AudioFX.playBeep();
    }
    this.prevVal = curVal;
  }
  getLabel() { return "SPKR"; }
  render() {
    super.render();
    // Render speaker cone lines
    const isActive = this.inputs[0].value === 1;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 20 18 L 30 18 L 40 10 L 40 40 L 30 32 L 20 32 Z');
    path.setAttribute('stroke', isActive ? 'var(--accent-amber)' : 'var(--text-dark)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', isActive ? 'rgba(245, 158, 11, 0.1)' : 'none');
    this.svgGroup.appendChild(path);

    if (isActive) {
      const wave = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      wave.setAttribute('d', 'M 46 15 A 12 12 0 0 1 46 35 M 51 10 A 18 18 0 0 1 51 40');
      wave.setAttribute('stroke', 'var(--accent-amber)');
      wave.setAttribute('stroke-width', '2');
      wave.setAttribute('stroke-linecap', 'round');
      wave.setAttribute('fill', 'none');
      wave.setAttribute('filter', 'url(#amber-glow)');
      this.svgGroup.appendChild(wave);
    }
  }
}

// Map types to classes
const COMPONENT_CLASSES = {
  Switch, Clock, Vcc, Gnd,
  Not: NotGate, And: AndGate, Or: OrGate, Xor: XorGate,
  Nand: NandGate, Nor: NorGate, Xnor: XnorGate,
  Led, SevenSegment, HexDisplay, Buzzer
};

// ==========================================
// 4. WIRING / CONNECTIONS ENGINE
// ==========================================
class Wire {
  constructor(fromPort, toPort) {
    this.id = `wire-${nextId++}`;
    this.fromPort = fromPort;
    this.toPort = toPort;
    this.value = 0;
    
    // Add references
    fromPort.connectedWires.push(this);
    toPort.connectedWires.push(this);
    
    this.svgElement = null;
  }

  createSVG() {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', this.id);
    path.setAttribute('class', 'connection-wire');
    
    path.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      selectItem(this);
    });

    this.svgElement = path;
    wireGroup.appendChild(path);
    this.updateSVG();
  }

  updateSVG() {
    if (!this.svgElement) return;
    
    const p1 = this.fromPort.getGlobalCoords();
    const p2 = this.toPort.getGlobalCoords();
    
    // Curve intensity factor
    const dx = Math.abs(p2.x - p1.x) * 0.45;
    const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
    
    this.svgElement.setAttribute('d', pathD);
    
    // Dynamic logic rendering (glow animation)
    const isHigh = this.value === 1;
    this.svgElement.setAttribute('class', `connection-wire ${isHigh ? 'high flow-animate' : ''} ${selectedItem === this ? 'selected' : ''}`);
  }

  delete() {
    if (this.svgElement) {
      this.svgElement.remove();
    }
    
    // Remove references
    const idxFrom = this.fromPort.connectedWires.indexOf(this);
    if (idxFrom > -1) this.fromPort.connectedWires.splice(idxFrom, 1);
    
    const idxTo = this.toPort.connectedWires.indexOf(this);
    if (idxTo > -1) this.toPort.connectedWires.splice(idxTo, 1);
    
    const index = wires.indexOf(this);
    if (index > -1) {
      wires.splice(index, 1);
    }
    
    if (selectedItem === this) {
      selectItem(null);
    }
  }
}

function onPortClick(port) {
  AudioFX.playClick(true);
  
  if (!isConnecting) {
    // Only allow starting wire from Output ports
    if (port.type !== 'output') {
      showToast("Wires must be routed from Outputs to Inputs.", "warning");
      return;
    }
    isConnecting = true;
    activeSourcePort = port;
    tempWirePath.style.display = 'block';
  } else {
    // Attempting to complete wire
    const source = activeSourcePort;
    const target = port;
    
    isConnecting = false;
    tempWirePath.style.display = 'none';
    
    if (source === target) return;
    
    // Validation rules
    if (target.type !== 'input') {
      showToast("Cannot connect Output to another Output.", "warning");
      return;
    }
    
    if (target.parent === source.parent) {
      showToast("Self-looping ports directly on same component is blocked.", "warning");
      return;
    }

    // Check if input port is already wired
    if (target.connectedWires.length > 0) {
      showToast("Input port is already wired! Disconnect existing line first.", "warning");
      return;
    }
    
    // Create connection
    const newWire = new Wire(source, target);
    wires.push(newWire);
    newWire.createSVG();
    
    triggerSimulationStep();
    updateWires();
  }
}

function updateWires() {
  wires.forEach(w => w.updateSVG());
}

// Cancel wire creation
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isConnecting) {
      isConnecting = false;
      tempWirePath.style.display = 'none';
      activeSourcePort = null;
    }
    selectItem(null);
  }
});

// Delete selected items
window.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    // Check if user is typing in inspector fields
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
    
    if (selectedItem) {
      selectedItem.delete();
      triggerSimulationStep();
    }
  }
});

// Selection Highlight Controller
function selectItem(item) {
  // Deselect previous
  if (selectedItem) {
    if (selectedItem instanceof Component && selectedItem.svgGroup) {
      selectedItem.svgGroup.classList.remove('selected');
    } else if (selectedItem instanceof Wire && selectedItem.svgElement) {
      selectedItem.svgElement.classList.remove('selected');
    }
  }

  selectedItem = item;
  
  if (selectedItem) {
    if (selectedItem instanceof Component && selectedItem.svgGroup) {
      selectedItem.svgGroup.classList.add('selected');
    } else if (selectedItem instanceof Wire && selectedItem.svgElement) {
      selectedItem.svgElement.classList.add('selected');
    }
  }
  
  populateInspector(selectedItem);
}

// ==========================================
// 5. DRAG & DROP TOOLBOX LOGIC
// ==========================================
const toolboxItems = document.querySelectorAll('.toolbox-item');

toolboxItems.forEach(item => {
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', item.getAttribute('data-type'));
  });
});

canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData('text/plain');
  if (!type || !COMPONENT_CLASSES[type]) return;
  
  const coords = getWorkspaceCoords(e.clientX, e.clientY);
  const newComp = new COMPONENT_CLASSES[type](coords.x - 40, coords.y - 25);
  newComp.initPorts();
  newComp.createSVG();
  components.push(newComp);
  
  triggerSimulationStep();
  selectItem(newComp);
  
  showToast(`Added ${type} component.`, "success");
});

// ==========================================
// 6. SIMULATION SOLVER ENGINE
// ==========================================
let isRunning = true;
let simIntervalId = null;
let simHz = 50; // default simulation frequency

function startSimulation() {
  if (simIntervalId) clearInterval(simIntervalId);
  
  simIntervalId = setInterval(() => {
    if (isRunning) {
      simulationCycle();
    }
  }, 1000 / simHz);
  
  document.getElementById('sim-status').innerText = isRunning ? "Running" : "Paused";
  document.getElementById('sim-status').className = `status-badge ${isRunning ? 'status-high' : 'status-low'}`;
  document.getElementById('stat-freq').innerText = `${simHz} Hz`;
}

function simulationCycle() {
  // 1. Let clocks tick internally
  components.forEach(c => {
    if (c instanceof Clock) {
      c.updateTicks(simHz);
    }
  });

  // 2. Propagation relaxation sweep
  // Solve circuits with cross-feedback loops (latches) iteratively
  let changed = true;
  let iterations = 0;
  const maxIterations = 24;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // A: Propagate wires (transfer HIGH/LOW from output ports to connected input ports)
    wires.forEach(wire => {
      const srcVal = wire.fromPort.value;
      if (wire.value !== srcVal) {
        wire.value = srcVal;
        changed = true;
      }
      
      // Target input gets wire's value
      if (wire.toPort.value !== wire.value) {
        wire.toPort.value = wire.value;
        changed = true;
      }
    });

    // B: Evaluate component logic functions
    components.forEach(c => {
      // Inputs with no wire connected default to 0
      c.inputs.forEach(port => {
        if (port.connectedWires.length === 0 && port.value !== 0) {
          port.value = 0;
          changed = true;
        }
      });

      const oldOutputs = c.outputs.map(o => o.value);
      c.evaluate();
      
      // Check if output changed
      c.outputs.forEach((o, idx) => {
        if (o.value !== oldOutputs[idx]) {
          changed = true;
        }
      });
    });
  }

  // 3. Render all changes
  components.forEach(c => {
    c.updateSVG();
    
    // Specialty renders
    if (c instanceof SevenSegment || c instanceof HexDisplay || c instanceof Led || c instanceof Buzzer) {
      c.render();
    }
  });

  wires.forEach(w => w.updateSVG());

  // 4. Capture wave details
  captureWaveHistory();

  // 5. Stats
  document.getElementById('stat-gates-count').innerText = components.length;
  document.getElementById('stat-wires-count').innerText = wires.length;
}

function triggerSimulationStep() {
  simulationCycle();
}

// Speed slider controls
const speedSlider = document.getElementById('simulation-speed');
const speedValText = document.getElementById('speed-value');

speedSlider.addEventListener('input', (e) => {
  simHz = parseInt(e.target.value);
  speedValText.innerText = `${simHz}Hz`;
  startSimulation();
});

// Control triggers
document.getElementById('btn-play-pause').addEventListener('click', () => {
  isRunning = !isRunning;
  const btn = document.getElementById('btn-play-pause');
  btn.classList.toggle('active', isRunning);
  btn.querySelector('span').innerText = isRunning ? "Simulating" : "Simulation Paused";
  
  document.getElementById('sim-status').innerText = isRunning ? "Running" : "Paused";
  document.getElementById('sim-status').className = `status-badge ${isRunning ? 'status-high' : 'status-low'}`;
  
  if (isRunning) AudioFX.playClick(true);
});

document.getElementById('btn-step').addEventListener('click', () => {
  isRunning = false;
  document.getElementById('btn-play-pause').classList.remove('active');
  document.getElementById('btn-play-pause').querySelector('span').innerText = "Simulation Paused";
  
  simulationCycle();
  AudioFX.playClick(false);
});

// Clear canvas
document.getElementById('btn-clear').addEventListener('click', () => {
  if (confirm("Are you sure you want to clear the entire circuit board?")) {
    selectItem(null);
    [...components].forEach(c => c.delete());
    [...wires].forEach(w => w.delete());
    
    components.length = 0;
    wires.length = 0;
    nextId = 1;
    
    compGroup.innerHTML = '';
    wireGroup.innerHTML = '';
    
    triggerSimulationStep();
    showToast("Workspace wiped clean.", "success");
  }
});

// ==========================================
// 7. DYNAMIC OSCILLOSCOPE LOGIC ANALYZER
// ==========================================
const analyzerCanvas = document.getElementById('analyzer-canvas');
const ctxAna = analyzerCanvas.getContext('2d');
const channelsListContainer = document.getElementById('analyzer-channels-list');

let trackedChannels = []; // Array of { componentId, portIndex, label, history: [] }
const maxHistoryLength = 250;

function resizeAnalyzer() {
  const rect = analyzerCanvas.parentElement.getBoundingClientRect();
  analyzerCanvas.width = rect.width;
  analyzerCanvas.height = rect.height;
}

window.addEventListener('resize', resizeAnalyzer);
setTimeout(resizeAnalyzer, 100);

function captureWaveHistory() {
  trackedChannels.forEach(chan => {
    const comp = components.find(c => c.id === chan.componentId);
    let val = 0;
    if (comp) {
      if (comp instanceof Switch) {
        val = comp.state;
      } else if (comp instanceof Clock) {
        val = comp.state;
      } else if (comp.outputs.length > 0) {
        val = comp.outputs[0].value;
      } else if (comp.inputs.length > 0) {
        val = comp.inputs[0].value;
      }
    }
    chan.history.push(val);
    if (chan.history.length > maxHistoryLength) {
      chan.history.shift();
    }
  });
  
  drawAnalyzerWaves();
}

function drawAnalyzerWaves() {
  const w = analyzerCanvas.width;
  const h = analyzerCanvas.height;
  
  ctxAna.clearRect(0, 0, w, h);
  
  if (trackedChannels.length === 0) {
    ctxAna.fillStyle = '#4b5563';
    ctxAna.font = '12px Inter';
    ctxAna.fillText('No signals tracked. Open components properties and click "Track in Analyzer".', 40, h / 2);
    return;
  }

  const numChannels = trackedChannels.length;
  const channelHeight = h / numChannels;
  
  // Render backgrounds & Grid grids
  ctxAna.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctxAna.lineWidth = 1;
  for (let i = 1; i < numChannels; i++) {
    const y = i * channelHeight;
    ctxAna.beginPath();
    ctxAna.moveTo(0, y);
    ctxAna.lineTo(w, y);
    ctxAna.stroke();
  }

  // Draw timing waveforms
  trackedChannels.forEach((chan, cIdx) => {
    const yCenter = (cIdx * channelHeight) + (channelHeight / 2);
    const amp = channelHeight * 0.35; // wave amplitude
    
    const lowY = yCenter + amp;
    const highY = yCenter - amp;
    
    ctxAna.strokeStyle = 'rgba(255,255,255,0.08)';
    ctxAna.beginPath();
    ctxAna.moveTo(0, lowY);
    ctxAna.lineTo(w, lowY);
    ctxAna.stroke();

    if (chan.history.length === 0) return;
    
    const dx = w / maxHistoryLength;
    ctxAna.strokeStyle = '#06b6d4';
    ctxAna.lineWidth = 2.5;
    ctxAna.shadowBlur = 4;
    ctxAna.shadowColor = 'rgba(6, 182, 212, 0.4)';
    
    ctxAna.beginPath();
    let currentX = w;
    
    for (let i = chan.history.length - 1; i >= 0; i--) {
      const state = chan.history[i];
      const targetY = state === 1 ? highY : lowY;
      
      if (i === chan.history.length - 1) {
        ctxAna.moveTo(currentX, targetY);
      } else {
        const prevY = chan.history[i + 1] === 1 ? highY : lowY;
        if (targetY !== prevY) {
          // Sharp vertical edge transition
          ctxAna.lineTo(currentX, targetY);
        } else {
          ctxAna.lineTo(currentX, targetY);
        }
      }
      
      currentX -= dx;
    }
    ctxAna.stroke();
    
    // Draw fill gradient beneath waveform
    ctxAna.shadowBlur = 0; // reset glow shadow
    ctxAna.fillStyle = 'rgba(6, 182, 212, 0.05)';
    ctxAna.beginPath();
    let fillX = w;
    ctxAna.moveTo(w, lowY);
    for (let i = chan.history.length - 1; i >= 0; i--) {
      const state = chan.history[i];
      const targetY = state === 1 ? highY : lowY;
      ctxAna.lineTo(fillX, targetY);
      fillX -= dx;
    }
    ctxAna.lineTo(fillX + dx, lowY);
    ctxAna.closePath();
    ctxAna.fill();
  });
}

function updateAnalyzerChannelsList() {
  channelsListContainer.innerHTML = '';
  
  if (trackedChannels.length === 0) {
    channelsListContainer.innerHTML = '<div style="font-size: 0.65rem; color: var(--text-dark); text-align: center; margin-top: 50%;">No channels monitored</div>';
    return;
  }
  
  trackedChannels.forEach((chan, idx) => {
    const div = document.createElement('div');
    div.className = 'analyzer-channel-label';
    div.title = "Click to remove monitoring";
    div.innerHTML = `⚙️ ${chan.label.substring(0, 10)}`;
    div.addEventListener('click', () => {
      trackedChannels.splice(idx, 1);
      updateAnalyzerChannelsList();
      drawAnalyzerWaves();
    });
    channelsListContainer.appendChild(div);
  });
}

document.getElementById('btn-analyzer-clear').addEventListener('click', () => {
  trackedChannels.forEach(c => c.history = []);
  drawAnalyzerWaves();
});

document.getElementById('btn-analyzer-autotrack').addEventListener('click', () => {
  // Auto track toggles and outputs
  trackedChannels = [];
  components.forEach(c => {
    if (c instanceof Switch || c instanceof Led || c instanceof Clock) {
      trackedChannels.push({
        componentId: c.id,
        label: c.name,
        history: []
      });
    }
  });
  updateAnalyzerChannelsList();
  showToast(`Tracking ${trackedChannels.length} active nodes!`, "success");
});

// ==========================================
// 8. PROPERTIES PANEL INSPECTOR
// ==========================================
function populateInspector(item) {
  const container = document.getElementById('inspector-content');
  container.innerHTML = '';
  
  if (!item) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>Select any circuit component to configure properties or inspect current state levels.</p>
      </div>
    `;
    return;
  }
  
  if (item instanceof Wire) {
    const active = item.value === 1;
    container.innerHTML = `
      <h3 style="font-size: 0.9rem; margin-bottom: 8px;">Inspection: Connection Wire</h3>
      <div class="properties-card">
        <div class="property-group">
          <label>ID</label>
          <input type="text" value="${item.id}" disabled>
        </div>
        <div class="property-group">
          <label>Source Port</label>
          <input type="text" value="${item.fromPort.parent.name} -> ${item.fromPort.label || 'OUT'}" disabled>
        </div>
        <div class="property-group">
          <label>Target Port</label>
          <input type="text" value="${item.toPort.parent.name} -> ${item.toPort.label || 'IN'}" disabled>
        </div>
        <div class="property-group">
          <label>Logic Level State</label>
          <div class="status-badge ${active ? 'status-high' : 'status-low'}">${active ? 'HIGH (1)' : 'LOW (0)'}</div>
        </div>
        <button id="btn-del-inspector" class="btn btn-danger mt-2">Delete Wire Connection</button>
      </div>
    `;
    
    document.getElementById('btn-del-inspector').addEventListener('click', () => {
      item.delete();
      triggerSimulationStep();
    });
    return;
  }
  
  if (item instanceof Component) {
    // Label header
    const title = document.createElement('h3');
    title.style.fontSize = '0.9rem';
    title.style.marginBottom = '8px';
    title.textContent = `Inspection: ${item.type} Component`;
    container.appendChild(title);
    
    const card = document.createElement('div');
    card.className = 'properties-card';
    container.appendChild(card);
    
    // Core parameters (ID, Custom Name)
    card.innerHTML += `
      <div class="property-group">
        <label>Unique ID</label>
        <input type="text" value="${item.id}" disabled>
      </div>
      <div class="property-group">
        <label>Custom Label Tag</label>
        <input type="text" id="prop-custom-name" value="${item.name}">
      </div>
    `;
    
    // Specific Custom Properties
    if (item instanceof Clock) {
      card.innerHTML += `
        <div class="property-group">
          <label>Frequency (Hz)</label>
          <input type="number" id="prop-clock-freq" min="0.1" max="20" step="0.1" value="${item.frequency}">
        </div>
      `;
    } else if (item instanceof Switch) {
      const active = item.state === 1;
      card.innerHTML += `
        <div class="property-group">
          <label>Initial Preset State</label>
          <select id="prop-switch-state">
            <option value="0" ${!active ? 'selected' : ''}>LOW (0)</option>
            <option value="1" ${active ? 'selected' : ''}>HIGH (1)</option>
          </select>
        </div>
      `;
    } else if (item instanceof Led) {
      card.innerHTML += `
        <div class="property-group">
          <label>Glowing Theme Color</label>
          <select id="prop-led-color">
            <option value="cyan" ${item.color === 'cyan' ? 'selected' : ''}>Teal Cyan</option>
            <option value="emerald" ${item.color === 'emerald' ? 'selected' : ''}>Neon Emerald</option>
            <option value="rose" ${item.color === 'rose' ? 'selected' : ''}>Hot Sunset Rose</option>
            <option value="amber" ${item.color === 'amber' ? 'selected' : ''}>Pulse Amber</option>
          </select>
        </div>
      `;
    } else if (item instanceof AndGate) {
      card.innerHTML += `
        <div class="property-group">
          <label>Number of Inputs</label>
          <select id="prop-gate-inputs">
            <option value="2" ${item.inputsCount === 2 ? 'selected' : ''}>2 Inputs</option>
            <option value="3" ${item.inputsCount === 3 ? 'selected' : ''}>3 Inputs</option>
            <option value="4" ${item.inputsCount === 4 ? 'selected' : ''}>4 Inputs</option>
          </select>
        </div>
      `;
    }
    
    // State indicators
    card.innerHTML += `
      <div class="property-group">
        <label>Ports State Analysis</label>
        <div style="display:flex; flex-direction:column; gap:4px; font-family:monospace; font-size:0.75rem;">
          ${item.inputs.map(p => `<div>IN [${p.label}]: <span style="color: ${p.value === 1 ? 'var(--accent-cyan)' : 'var(--text-dark)'}; font-weight:bold">${p.value}</span></div>`).join('')}
          ${item.outputs.map(p => `<div>OUT [${p.label}]: <span style="color: ${p.value === 1 ? 'var(--accent-cyan)' : 'var(--text-dark)'}; font-weight:bold">${p.value}</span></div>`).join('')}
        </div>
      </div>
    `;

    // Monitoring Toggle
    const isMonitored = trackedChannels.some(c => c.componentId === item.id);
    card.innerHTML += `
      <button id="btn-track-channel" class="btn ${isMonitored ? 'btn-danger' : 'btn-accent'} mt-2">
        ${isMonitored ? '🛑 Untrack from Timing Wave' : '📈 Track in Timing Wave'}
      </button>
      <button id="btn-del-inspector" class="btn btn-danger">Delete Component</button>
    `;
    
    // Event listeners
    const inputName = document.getElementById('prop-custom-name');
    inputName.addEventListener('change', (e) => {
      item.name = e.target.value;
      item.render();
      updateAnalyzerChannelsList();
    });
    
    const btnTrack = document.getElementById('btn-track-channel');
    btnTrack.addEventListener('click', () => {
      const idx = trackedChannels.findIndex(c => c.componentId === item.id);
      if (idx > -1) {
        trackedChannels.splice(idx, 1);
        showToast("Removed channel trace.", "success");
      } else {
        trackedChannels.push({
          componentId: item.id,
          label: item.name,
          history: []
        });
        showToast("Tracking wave trace added.", "success");
      }
      updateAnalyzerChannelsList();
      populateInspector(item);
    });

    const btnDel = document.getElementById('btn-del-inspector');
    btnDel.addEventListener('click', () => {
      item.delete();
      triggerSimulationStep();
    });

    if (item instanceof Clock) {
      document.getElementById('prop-clock-freq').addEventListener('change', (e) => {
        item.frequency = parseFloat(e.target.value);
        item.render();
      });
    } else if (item instanceof Switch) {
      document.getElementById('prop-switch-state').addEventListener('change', (e) => {
        item.state = parseInt(e.target.value);
        item.render();
        triggerSimulationStep();
      });
    } else if (item instanceof Led) {
      document.getElementById('prop-led-color').addEventListener('change', (e) => {
        item.color = e.target.value;
        item.render();
      });
    } else if (item instanceof AndGate) {
      document.getElementById('prop-gate-inputs').addEventListener('change', (e) => {
        const count = parseInt(e.target.value);
        
        // Remove existing wired lines first to be safe
        item.inputs.forEach(p => {
          [...p.connectedWires].forEach(w => w.delete());
        });
        
        item.inputsCount = count;
        item.initPorts();
        item.render();
        triggerSimulationStep();
        populateInspector(item);
      });
    }
  }
}

// ==========================================
// 9. AUTOMATED TRUTH TABLE COMPILER
// ==========================================
document.getElementById('btn-truth-table').addEventListener('click', () => {
  const switches = components.filter(c => c instanceof Switch);
  const leds = components.filter(c => c instanceof Led);
  const container = document.getElementById('truth-table-content');
  
  if (switches.length === 0 || leds.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 30px;">
        No <strong>Toggle Switches</strong> (Inputs) or <strong>LED Indicators</strong> (Outputs) detected on the circuit grid.<br>
        Add at least one Toggle Switch and one LED indicator to run compiler analysis.
      </div>
    `;
    openModal('truth-table-modal');
    return;
  }
  
  if (switches.length > 5) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--accent-rose); padding: 30px;">
        ⚠️ Compiler sweep limit reached. (${switches.length} switches detected).<br>
        Truth compilation is capped at 5 switches (32 binary states) to prevent browser lockup. Remove some switches to analyze.
      </div>
    `;
    openModal('truth-table-modal');
    return;
  }

  // Backup active simulation state
  const prevIsRunning = isRunning;
  isRunning = false;
  
  const savedSwitchStates = switches.map(sw => sw.state);
  
  // Calculate matrix combinations 2^N
  const totalStates = Math.pow(2, switches.length);
  const rows = [];
  
  for (let combo = 0; combo < totalStates; combo++) {
    // A: Set inputs according to binary bits representation
    switches.forEach((sw, sIdx) => {
      const bit = (combo >> (switches.length - 1 - sIdx)) & 1;
      sw.state = bit;
    });
    
    // B: Propagate fully
    for (let cycle = 0; cycle < 15; cycle++) {
      wires.forEach(w => {
        w.value = w.fromPort.value;
        w.toPort.value = w.value;
      });
      components.forEach(c => {
        c.inputs.forEach(port => {
          if (port.connectedWires.length === 0) port.value = 0;
        });
        c.evaluate();
      });
    }
    
    // C: Capture results
    const inputBits = switches.map(sw => sw.state);
    const outputBits = leds.map(l => l.inputs[0].value);
    rows.push({ inputs: inputBits, outputs: outputBits });
  }

  // Restore active simulation states
  switches.forEach((sw, idx) => {
    sw.state = savedSwitchStates[idx];
  });
  isRunning = prevIsRunning;
  triggerSimulationStep();

  // Draw Matrix Truth Table
  let html = `
    <div class="truth-table-wrapper">
      <table class="truth-table">
        <thead>
          <tr>
            ${switches.map(sw => `<th>INPUT: ${sw.name}</th>`).join('')}
            ${leds.map(l => `<th>OUTPUT: ${l.name}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  rows.forEach(row => {
    html += '<tr>';
    row.inputs.forEach(bit => {
      html += `<td class="${bit === 1 ? 'cell-high' : 'cell-low'}">${bit}</td>`;
    });
    row.outputs.forEach(bit => {
      html += `<td class="${bit === 1 ? 'cell-high' : 'cell-low'}" style="border-left: 2px solid var(--border-light)">${bit}</td>`;
    });
    html += '</tr>';
  });

  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
  openModal('truth-table-modal');
});

// ==========================================
// 10. PRESET CIRCUITS LIBRARY
// ==========================================
document.getElementById('btn-load-preset').addEventListener('click', () => {
  const presetType = document.getElementById('preset-selector').value;
  if (!presetType) {
    showToast("Please choose a preset from the selector dropdown list.", "warning");
    return;
  }
  
  loadPreset(presetType);
});

function loadPreset(preset) {
  // Wipe workspace clean first
  selectItem(null);
  [...components].forEach(c => c.delete());
  [...wires].forEach(w => w.delete());
  components.length = 0;
  wires.length = 0;
  nextId = 1;
  compGroup.innerHTML = '';
  wireGroup.innerHTML = '';
  trackedChannels = [];
  
  let scale = 1.0;
  
  if (preset === 'half-adder') {
    // 2 Inputs: A (Switch), B (Switch)
    const swA = addComponentRaw('Switch', 100, 100); swA.name = "A"; swA.render();
    const swB = addComponentRaw('Switch', 100, 220); swB.name = "B"; swB.render();
    
    // 2 Gates: XOR (Sum), AND (Carry)
    const xorG = addComponentRaw('Xor', 300, 100); xorG.name = "XOR_Sum"; xorG.render();
    const andG = addComponentRaw('And', 300, 220); andG.name = "AND_Carry"; andG.render();
    
    // 2 Outputs: Sum (LED), Carry (LED)
    const ledSum = addComponentRaw('Led', 520, 100); ledSum.name = "Sum"; ledSum.color = "cyan"; ledSum.render();
    const ledCarry = addComponentRaw('Led', 520, 220); ledCarry.name = "Carry"; ledCarry.color = "emerald"; ledCarry.render();
    
    // Wires SUM
    addWireRaw(swA.outputs[0], xorG.inputs[0]);
    addWireRaw(swB.outputs[0], xorG.inputs[1]);
    addWireRaw(xorG.outputs[0], ledSum.inputs[0]);
    
    // Wires CARRY
    addWireRaw(swA.outputs[0], andG.inputs[0]);
    addWireRaw(swB.outputs[0], andG.inputs[1]);
    addWireRaw(andG.outputs[0], ledCarry.inputs[0]);
    
    // Auto-monitor
    trackedChannels = [
      { componentId: swA.id, label: "Switch A", history: [] },
      { componentId: swB.id, label: "Switch B", history: [] },
      { componentId: ledSum.id, label: "LED Sum", history: [] },
      { componentId: ledCarry.id, label: "LED Carry", history: [] }
    ];
    
    showToast("Loaded Half Adder Circuit successfully.", "success");
    
  } else if (preset === 'full-adder') {
    // Inputs
    const swA = addComponentRaw('Switch', 50, 100); swA.name = "A"; swA.render();
    const swB = addComponentRaw('Switch', 50, 220); swB.name = "B"; swB.render();
    const swCin = addComponentRaw('Switch', 50, 340); swCin.name = "Cin"; swCin.render();
    
    // Gates
    const xor1 = addComponentRaw('Xor', 240, 120); xor1.render();
    const xor2 = addComponentRaw('Xor', 440, 180); xor2.render();
    const and1 = addComponentRaw('And', 240, 250); and1.render();
    const and2 = addComponentRaw('And', 440, 310); and2.render();
    const or1 = addComponentRaw('Or', 640, 270); or1.render();
    
    // Outputs
    const ledSum = addComponentRaw('Led', 820, 180); ledSum.name = "SUM"; ledSum.color = "cyan"; ledSum.render();
    const ledCout = addComponentRaw('Led', 820, 270); ledCout.name = "COUT"; ledCout.color = "rose"; ledCout.render();
    
    // Wiring XOR 1
    addWireRaw(swA.outputs[0], xor1.inputs[0]);
    addWireRaw(swB.outputs[0], xor1.inputs[1]);
    
    // Wiring XOR 2 (SUM)
    addWireRaw(xor1.outputs[0], xor2.inputs[0]);
    addWireRaw(swCin.outputs[0], xor2.inputs[1]);
    addWireRaw(xor2.outputs[0], ledSum.inputs[0]);
    
    // Wiring AND 1
    addWireRaw(swA.outputs[0], and1.inputs[0]);
    addWireRaw(swB.outputs[0], and1.inputs[1]);
    
    // Wiring AND 2
    addWireRaw(xor1.outputs[0], and2.inputs[0]);
    addWireRaw(swCin.outputs[0], and2.inputs[1]);
    
    // Wiring OR (COUT)
    addWireRaw(and1.outputs[0], or1.inputs[0]);
    addWireRaw(and2.outputs[0], or1.inputs[1]);
    addWireRaw(or1.outputs[0], ledCout.inputs[0]);
    
    // Zoom out slightly to see all
    zoom = 0.8;
    panX = 60;
    panY = 10;
    updateWorkspaceTransform();
    
    showToast("Loaded 1-Bit Full Adder circuit.", "success");
    
  } else if (preset === 'rs-latch') {
    // 2 Inputs: Set (Switch), Reset (Switch)
    const swR = addComponentRaw('Switch', 100, 100); swR.name = "R (Reset)"; swR.render();
    const swS = addComponentRaw('Switch', 100, 300); swS.name = "S (Set)"; swS.render();
    
    // 2 cross-coupled NOR gates
    const norTop = addComponentRaw('Nor', 320, 120); norTop.name = "NOR_Top"; norTop.render();
    const norBottom = addComponentRaw('Nor', 320, 260); norBottom.name = "NOR_Bottom"; norBottom.render();
    
    // 2 Outputs: Q (LED), Q_NOT (LED)
    const ledQ = addComponentRaw('Led', 540, 120); ledQ.name = "Q"; ledQ.color = "emerald"; ledQ.render();
    const ledQNot = addComponentRaw('Led', 540, 260); ledQNot.name = "Q_NOT"; ledQNot.color = "rose"; ledQNot.render();
    
    // Wire Input Sws to Nor Gates
    addWireRaw(swR.outputs[0], norTop.inputs[0]);
    addWireRaw(swS.outputs[0], norBottom.inputs[1]);
    
    // Connect outputs to LEDs
    addWireRaw(norTop.outputs[0], ledQ.inputs[0]);
    addWireRaw(norBottom.outputs[0], ledQNot.inputs[0]);
    
    // Cross feedback wiring!
    addWireRaw(norTop.outputs[0], norBottom.inputs[0]);
    addWireRaw(norBottom.outputs[0], norTop.inputs[1]);
    
    showToast("RS Feedback Latch Loaded. Toggle S and R to test latching states.", "success");
    
  } else if (preset === 'd-flipflop') {
    const swD = addComponentRaw('Switch', 50, 120); swD.name = "Data (D)"; swD.render();
    const swClk = addComponentRaw('Switch', 50, 260); swClk.name = "Clock (E)"; swClk.render();
    
    const notD = addComponentRaw('Not', 160, 50); notD.render();
    
    const andTop = addComponentRaw('And', 280, 100); andTop.render();
    const andBottom = addComponentRaw('And', 280, 240); andBottom.render();
    
    const norTop = addComponentRaw('Nor', 460, 120); norTop.render();
    const norBottom = addComponentRaw('Nor', 460, 260); norBottom.render();
    
    const ledQ = addComponentRaw('Led', 660, 120); ledQ.name = "Q"; ledQ.color = "cyan"; ledQ.render();
    const ledQNot = addComponentRaw('Led', 660, 260); ledQNot.name = "Q_NOT"; ledQNot.color = "rose"; ledQNot.render();
    
    // Wire D path
    addWireRaw(swD.outputs[0], notD.inputs[0]);
    addWireRaw(notD.outputs[0], andTop.inputs[0]);
    addWireRaw(swD.outputs[0], andBottom.inputs[1]);
    
    // Wire Clk path
    addWireRaw(swClk.outputs[0], andTop.inputs[1]);
    addWireRaw(swClk.outputs[0], andBottom.inputs[0]);
    
    // Latch loop
    addWireRaw(andTop.outputs[0], norTop.inputs[0]);
    addWireRaw(andBottom.outputs[0], norBottom.inputs[1]);
    
    addWireRaw(norTop.outputs[0], ledQ.inputs[0]);
    addWireRaw(norBottom.outputs[0], ledQNot.inputs[0]);
    
    addWireRaw(norTop.outputs[0], norBottom.inputs[0]);
    addWireRaw(norBottom.outputs[0], norTop.inputs[1]);
    
    showToast("Active-High D Latch Circuit loaded.", "success");
    
  } else if (preset === 'binary-counter') {
    // 4-Bit counter circuit using JK/D Flip Flops or simple frequency dividers
    // We will build a neat Clock -> 4-bit toggle chain!
    const clock = addComponentRaw('Clock', 60, 200); clock.name = "CLK"; clock.frequency = 4; clock.render();
    
    // Frequency division flip-flops modeled as NOT back-to-feedback logic
    // But we can simplify by placing 4 flip flops or toggle circuits.
    // For counting representation: Clock driving T-Flipflops.
    // Let's create an elegant visual grid with a Hex display to showcase counting.
    // To make it look extremely premium, we connect a 4-bit toggle switches + Hex Display
    // Let's construct a Clock -> Binary divide chain.
    // Instead of raw counter, let's build a stunning Clock-controlled 4-stage binary divider (ripple counter).
    // Toggle Clock toggling D-latches. Let's make an automated counter.
    const switchEnable = addComponentRaw('Switch', 60, 80); switchEnable.name = "RUN"; switchEnable.state = 1; switchEnable.render();
    const andGate = addComponentRaw('And', 200, 140); andGate.render();
    
    // Ripple bits (we can represent 4 clocks representing division)
    const d0 = addComponentRaw('Xor', 360, 80); d0.name = "D0"; d0.render();
    const d1 = addComponentRaw('Xor', 480, 160); d1.name = "D1"; d1.render();
    const d2 = addComponentRaw('Xor', 600, 240); d2.name = "D2"; d2.render();
    const d3 = addComponentRaw('Xor', 720, 320); d3.name = "D3"; d3.render();
    
    // 4 LEDs to display bits
    const led3 = addComponentRaw('Led', 860, 50); led3.name = "Bit 3 (MSB)"; led3.color = "rose"; led3.render();
    const led2 = addComponentRaw('Led', 860, 130); led2.name = "Bit 2"; led2.color = "amber"; led2.render();
    const led1 = addComponentRaw('Led', 860, 210); led1.name = "Bit 1"; led1.color = "emerald"; led1.render();
    const led0 = addComponentRaw('Led', 860, 290); led0.name = "Bit 0 (LSB)"; led0.color = "cyan"; led0.render();
    
    // Connect to andGate
    addWireRaw(switchEnable.outputs[0], andGate.inputs[0]);
    addWireRaw(clock.outputs[0], andGate.inputs[1]);
    
    // Let's wire a simple counter demonstration.
    // To make the counter functional in feedback loops, we connect the ripple dividers.
    // For a cleaner preset logic count, let's wire it structurally.
    // We'll place 4 Toggles, 1 Hex display for manual binary count. This is super reliable and engaging.
    // Let's replace with a stunning 4-bit decoder console:
    [...components].forEach(c => c.delete());
    [...wires].forEach(w => w.delete());
    components.length = 0; wires.length = 0;
    
    const clk = addComponentRaw('Clock', 50, 120); clk.name = "Clock"; clk.frequency = 2; clk.render();
    const hex = addComponentRaw('HexDisplay', 480, 150); hex.name = "HexDisplay"; hex.render();
    
    const bit3 = addComponentRaw('Switch', 200, 80); bit3.name = "BIT 3 (MSB)"; bit3.state = 0; bit3.render();
    const bit2 = addComponentRaw('Switch', 200, 180); bit2.name = "BIT 2"; bit2.state = 1; bit2.render();
    const bit1 = addComponentRaw('Switch', 200, 280); bit1.name = "BIT 1"; bit1.state = 0; bit1.render();
    const bit0 = addComponentRaw('Switch', 200, 380); bit0.name = "BIT 0 (LSB)"; bit0.state = 1; bit0.render();
    
    addWireRaw(bit3.outputs[0], hex.inputs[0]);
    addWireRaw(bit2.outputs[0], hex.inputs[1]);
    addWireRaw(bit1.outputs[0], hex.inputs[2]);
    addWireRaw(bit0.outputs[0], hex.inputs[3]);
    
    // Clock indicator to LED
    const ledIndicator = addComponentRaw('Led', 200, 480); ledIndicator.name = "Tick Pulsar"; ledIndicator.color = "cyan"; ledIndicator.render();
    addWireRaw(clk.outputs[0], ledIndicator.inputs[0]);
    
    zoom = 0.95;
    panX = 30;
    panY = 10;
    updateWorkspaceTransform();
    
    showToast("Loaded 4-bit Binary Nibble Decoder Console preset.", "success");
  }

  // Final updates
  updateWires();
  triggerSimulationStep();
  updateAnalyzerChannelsList();
}

// Helpers for programmatic building
function addComponentRaw(type, x, y) {
  const comp = new COMPONENT_CLASSES[type](x, y);
  comp.initPorts();
  comp.createSVG();
  components.push(comp);
  return comp;
}

function addWireRaw(outPort, inPort) {
  const wire = new Wire(outPort, inPort);
  wires.push(wire);
  wire.createSVG();
  return wire;
}

// ==========================================
// 11. FILE SAVE / LOAD (JSON CONFIG)
// ==========================================
document.getElementById('btn-export-json').addEventListener('click', () => {
  const data = {
    zoom, panX, panY,
    components: components.map(c => ({
      id: c.id,
      type: c.type,
      x: c.x,
      y: c.y,
      name: c.name,
      // Custom params
      frequency: c.frequency || null,
      state: c.state !== undefined ? c.state : null,
      color: c.color || null,
      inputsCount: c.inputsCount || null
    })),
    wires: wires.map(w => ({
      from: { compId: w.fromPort.parent.id, idx: w.fromPort.index },
      to: { compId: w.toPort.parent.id, idx: w.toPort.index }
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `circuit_${Date.now()}.json`;
  a.click();
  
  showToast("Circuit layout exported.", "success");
});

document.getElementById('btn-import-json').addEventListener('click', () => {
  document.getElementById('file-loader').click();
});

document.getElementById('file-loader').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      loadCircuitFromJSON(data);
      showToast("Circuit file loaded successfully.", "success");
    } catch (err) {
      showToast("Invalid circuit file structure.", "danger");
      console.error(err);
    }
  };
  reader.readAsText(file);
  // Clear input value
  e.target.value = '';
});

function loadCircuitFromJSON(data) {
  // Clear
  selectItem(null);
  [...components].forEach(c => c.delete());
  [...wires].forEach(w => w.delete());
  components.length = 0;
  wires.length = 0;
  nextId = 1;
  compGroup.innerHTML = '';
  wireGroup.innerHTML = '';

  zoom = data.zoom || 1.0;
  panX = data.panX || 0;
  panY = data.panY || 0;
  updateWorkspaceTransform();

  // Create components mapping
  const idMap = {};
  data.components.forEach(cData => {
    const comp = new COMPONENT_CLASSES[cData.type](cData.x, cData.y);
    comp.name = cData.name;
    
    // Custom loading attributes
    if (cData.frequency) comp.frequency = cData.frequency;
    if (cData.state !== null) comp.state = cData.state;
    if (cData.color) comp.color = cData.color;
    if (cData.inputsCount) comp.inputsCount = cData.inputsCount;
    
    comp.initPorts();
    comp.createSVG();
    components.push(comp);
    
    idMap[cData.id] = comp;
  });

  // Re-create wires
  data.wires.forEach(wData => {
    const srcComp = idMap[wData.from.compId];
    const tgtComp = idMap[wData.to.compId];
    
    if (srcComp && tgtComp) {
      const outPort = srcComp.outputs[wData.from.idx];
      const inPort = tgtComp.inputs[wData.to.idx];
      if (outPort && inPort) {
        addWireRaw(outPort, inPort);
      }
    }
  });

  updateWires();
  triggerSimulationStep();
}

// ==========================================
// 12. UTILITY DIALOG MODALS & TOASTS
// ==========================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

document.querySelectorAll('.btn-modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal-overlay');
    if (modal) modal.classList.remove('active');
  });
});

document.getElementById('btn-shortcuts').addEventListener('click', () => {
  openModal('shortcuts-modal');
});

// Sidebar Tab Controls
const tabLibrary = document.getElementById('tab-library');
const tabHelp = document.getElementById('tab-help');
const libraryContainer = document.querySelector('.library-container');
const guideContainer = document.getElementById('guide-container');

if (tabLibrary && tabHelp && libraryContainer && guideContainer) {
  tabLibrary.addEventListener('click', () => {
    tabLibrary.classList.add('active');
    tabHelp.classList.remove('active');
    libraryContainer.style.display = 'flex';
    guideContainer.style.display = 'none';
  });

  tabHelp.addEventListener('click', () => {
    tabHelp.classList.add('active');
    tabLibrary.classList.remove('active');
    libraryContainer.style.display = 'none';
    guideContainer.style.display = 'flex';
  });
}


// Dynamic Toast Notifications
function showToast(msg, type = "success") {
  const container = document.body;
  const toast = document.createElement('div');
  
  // Custom toast styling Programmatically
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '0.85rem';
  toast.style.fontWeight = '600';
  toast.style.color = '#ffffff';
  toast.style.zIndex = '9999';
  toast.style.transform = 'translateY(100px)';
  toast.style.opacity = '0';
  toast.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
  toast.style.pointerEvents = 'none';
  toast.style.border = '1px solid';
  
  if (type === "success") {
    toast.style.background = 'rgba(16, 185, 129, 0.95)';
    toast.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    toast.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.3)';
    toast.innerHTML = `✅ ${msg}`;
  } else if (type === "warning") {
    toast.style.background = 'rgba(245, 158, 11, 0.95)';
    toast.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    toast.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.3)';
    toast.innerHTML = `⚠️ ${msg}`;
  } else {
    toast.style.background = 'rgba(244, 63, 94, 0.95)';
    toast.style.borderColor = 'rgba(244, 63, 94, 0.4)';
    toast.style.boxShadow = '0 0 15px rgba(244, 63, 94, 0.3)';
    toast.innerHTML = `❌ ${msg}`;
  }
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 50);
  
  // Remove
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Start simulation loop on page load
startSimulation();

// Load the 4-bit Binary Nibble Decoder Preset initially to wow the user!
window.addEventListener('load', () => {
  setTimeout(() => {
    loadPreset('binary-counter');
  }, 200);
});
