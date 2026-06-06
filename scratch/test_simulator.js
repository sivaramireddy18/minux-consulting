const fs = require('fs');
const path = require('path');

// Mock DOM environment with a proxy for the context to handle any missing drawing methods automatically
const dummyContext = new Proxy({
  clearRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fillText: () => {},
  fillRect: () => {},
  closePath: () => {},
  fill: () => {}
}, {
  get: (target, prop) => {
    if (prop in target) {
      return target[prop];
    }
    return () => {};
  }
});

const dummyElement = {
  addEventListener: () => {},
  appendChild: () => {},
  setAttribute: () => {},
  removeAttribute: () => {},
  querySelector: () => dummyElement,
  querySelectorAll: () => [],
  classList: {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false
  },
  style: {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 200 }),
  remove: () => {},
  getContext: () => dummyContext,
  parentElement: {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 200 })
  }
};

global.document = {
  getElementById: (id) => {
    if (id === 'sim-status') {
      return { classList: dummyElement.classList, style: {} };
    }
    return dummyElement;
  },
  body: dummyElement,
  querySelectorAll: () => [],
  querySelector: () => dummyElement,
  createElementNS: () => dummyElement,
  createElement: () => dummyElement,
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.AudioFX = {
  init: () => {},
  playClick: () => {},
  playBeep: () => {}
};

// Load app.js code by reading file and eval'ing it in this context
const appJsPath = path.join(__dirname, '../web-portal/logic-gate-simulator/app.js');
let appJsCode = fs.readFileSync(appJsPath, 'utf8');

// Expose internal classes/functions globally
appJsCode = appJsCode.replace('const COMPONENT_CLASSES =', 'global.COMPONENT_CLASSES =');
appJsCode = appJsCode.replace('function loadPreset', 'global.loadPreset = loadPreset; function loadPreset');
appJsCode = appJsCode.replace('function simulationCycle', 'global.simulationCycle = simulationCycle; function simulationCycle');
appJsCode = appJsCode.replace('const components =', 'global.components =');
appJsCode = appJsCode.replace('const wires =', 'global.wires =');

try {
  eval(appJsCode);
  console.log("Successfully loaded app.js!");
} catch (e) {
  console.error("Failed to load app.js:", e);
  process.exit(1);
}

let failed = false;

// 1. TEST PRESET: Half Adder
console.log("\nTesting Half Adder Preset...");
global.loadPreset('half-adder');

// Find inputs (Switches A and B) and outputs (LEDs Sum and Carry)
const swA = global.components.find(c => c.name === "A");
const swB = global.components.find(c => c.name === "B");
const ledSum = global.components.find(c => c.name === "Sum");
const ledCarry = global.components.find(c => c.name === "Carry");

if (!swA || !swB || !ledSum || !ledCarry) {
  console.error("Error: Could not find all Half Adder components.");
  failed = true;
} else {
  // Inputs: [A, B] -> Expected outputs: [Sum, Carry]
  const cases = [
    { in: [0, 0], out: [0, 0] },
    { in: [0, 1], out: [1, 0] },
    { in: [1, 0], out: [1, 0] },
    { in: [1, 1], out: [0, 1] }
  ];

  cases.forEach(cCase => {
    swA.state = cCase.in[0];
    swB.state = cCase.in[1];
    
    // Run propagation cycle a few times to settle
    for (let i = 0; i < 5; i++) {
      global.simulationCycle();
    }

    const actualSum = ledSum.inputs[0].value;
    const actualCarry = ledCarry.inputs[0].value;

    if (actualSum !== cCase.out[0] || actualCarry !== cCase.out[1]) {
      console.error(`FAIL: Half Adder Case [A=${cCase.in[0]}, B=${cCase.in[1]}] expected [Sum=${cCase.out[0]}, Carry=${cCase.out[1]}], got [Sum=${actualSum}, Carry=${actualCarry}]`);
      failed = true;
    } else {
      console.log(`PASS: Half Adder Case [A=${cCase.in[0]}, B=${cCase.in[1]}] -> [Sum=${actualSum}, Carry=${actualCarry}]`);
    }
  });
}

// 2. TEST PRESET: Full Adder
console.log("\nTesting Full Adder Preset...");
global.loadPreset('full-adder');

const faA = global.components.find(c => c.name === "A");
const faB = global.components.find(c => c.name === "B");
const faCin = global.components.find(c => c.name === "Cin");
const faSum = global.components.find(c => c.name === "SUM");
const faCout = global.components.find(c => c.name === "COUT");

if (!faA || !faB || !faCin || !faSum || !faCout) {
  console.error("Error: Could not find all Full Adder components.");
  failed = true;
} else {
  const cases = [
    { in: [0, 0, 0], out: [0, 0] },
    { in: [0, 0, 1], out: [1, 0] },
    { in: [0, 1, 0], out: [1, 0] },
    { in: [0, 1, 1], out: [0, 1] },
    { in: [1, 0, 0], out: [1, 0] },
    { in: [1, 0, 1], out: [0, 1] },
    { in: [1, 1, 0], out: [0, 1] },
    { in: [1, 1, 1], out: [1, 1] }
  ];

  cases.forEach(cCase => {
    faA.state = cCase.in[0];
    faB.state = cCase.in[1];
    faCin.state = cCase.in[2];

    for (let i = 0; i < 5; i++) {
      global.simulationCycle();
    }

    const actualSum = faSum.inputs[0].value;
    const actualCout = faCout.inputs[0].value;

    if (actualSum !== cCase.out[0] || actualCout !== cCase.out[1]) {
      console.error(`FAIL: Full Adder Case [A=${cCase.in[0]}, B=${cCase.in[1]}, Cin=${cCase.in[2]}] expected [Sum=${cCase.out[0]}, Cout=${cCase.out[1]}], got [Sum=${actualSum}, Cout=${actualCout}]`);
      failed = true;
    } else {
      console.log(`PASS: Full Adder Case [A=${cCase.in[0]}, B=${cCase.in[1]}, Cin=${cCase.in[2]}] -> [Sum=${actualSum}, Cout=${actualCout}]`);
    }
  });
}

if (failed) {
  console.error("\nTESTS FAILED!");
  process.exit(1);
} else {
  console.log("\nALL TESTS PASSED!");
}
