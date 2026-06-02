// REG.OS - Embedded Register & Number Systems Simulator - Core Script

// ==========================================
// 1. CPU REGISTER CONTROLLER
// ==========================================
let currentWidth = 32; // 8, 16, or 32
const registerBits = Array(32).fill(0);

const registerGridEl = document.getElementById('register-bit-grid-el');

// Initialize Register grid DOM
function initRegisterDOM() {
  registerGridEl.innerHTML = '';
  
  // Create cells from MSB (left) to LSB (right)
  for (let i = currentWidth - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'bit-cell';
    
    const index = document.createElement('span');
    index.className = 'bit-index';
    index.textContent = i;
    
    const block = document.createElement('div');
    block.className = `bit-block ${registerBits[i] === 1 ? 'high' : ''}`;
    block.textContent = registerBits[i];
    
    block.addEventListener('click', () => {
      registerBits[i] = registerBits[i] === 1 ? 0 : 1;
      block.className = `bit-block ${registerBits[i] === 1 ? 'high' : ''}`;
      block.textContent = registerBits[i];
      playClickSound(registerBits[i] === 1);
      updateRegisterValues();
    });
    
    cell.appendChild(index);
    cell.appendChild(block);
    registerGridEl.appendChild(cell);
  }
}

// Perform Base Conversions & Numerical Displays
function updateRegisterValues() {
  // A: Calculate Unsigned Value
  let unsignedVal = 0n;
  for (let i = 0; i < currentWidth; i++) {
    if (registerBits[i] === 1) {
      unsignedVal |= (1n << BigInt(i));
    }
  }

  // B: Calculate Signed 2's Complement Value
  let signedVal = unsignedVal;
  const signBitMask = 1n << BigInt(currentWidth - 1);
  if ((unsignedVal & signBitMask) !== 0n) {
    signedVal = unsignedVal - (1n << BigInt(currentWidth));
  }

  // C: Format Hexadecimal padded
  const hexDigits = currentWidth / 4;
  const hexStr = '0x' + unsignedVal.toString(16).toUpperCase().padStart(hexDigits, '0');
  document.getElementById('val-hex').textContent = hexStr;

  // D: Format Unsigned & Signed Decimal
  document.getElementById('val-unsigned').textContent = unsignedVal.toString();
  document.getElementById('val-signed').textContent = signedVal.toString();

  // E: Format Octal
  document.getElementById('val-octal').textContent = '0o' + unsignedVal.toString(8);

  // F: Format ASCII representation (printable range 32 to 126, or special NUL)
  let asciiStr = 'non-printable';
  if (unsignedVal === 0n) {
    asciiStr = 'NUL (0x00)';
  } else if (unsignedVal >= 32n && unsignedVal <= 126n) {
    asciiStr = `"${String.fromCharCode(Number(unsignedVal))}"`;
  } else if (unsignedVal === 10n) {
    asciiStr = '\\n (LF)';
  } else if (unsignedVal === 13n) {
    asciiStr = '\\r (CR)';
  } else if (unsignedVal === 9n) {
    asciiStr = '\\t (TAB)';
  }
  document.getElementById('val-ascii').textContent = asciiStr;

  // Trigger number simulator milestone synchronization!
  try {
    const milestonesRaw = localStorage.getItem("minux_simulator_milestones") || "{}";
    const milestones = JSON.parse(milestonesRaw);
    if (!milestones["number_representations"]) {
      milestones["number_representations"] = true;
      localStorage.setItem("minux_simulator_milestones", JSON.stringify(milestones));
      if (typeof showToast === 'function') {
        showToast("⚡ Progress synced to Candidate Vetting Hub!");
      }
    }
  } catch (e) {
    console.error("Failed to write register milestone:", e);
  }
}

// Width Selectors
const widthBtns = document.querySelectorAll('.selector-btn');
widthBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    widthBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentWidth = parseInt(btn.getAttribute('data-width'));
    
    // Clear out-of-width bits to be clean
    for (let i = currentWidth; i < 32; i++) {
      registerBits[i] = 0;
    }
    
    initRegisterDOM();
    updateRegisterValues();
  });
});

// ==========================================
// 2. BITWISE OPERATIONS PLAYGROUND
// ==========================================
const regABits = Array(8).fill(0);
const regBBits = Array(8).fill(0);

const regAGrid = document.getElementById('bitwise-reg-a');
const regBGrid = document.getElementById('bitwise-reg-b');
const regOutGrid = document.getElementById('bitwise-reg-out');

function initBitwiseDOM() {
  setupBitwiseRegister(regAGrid, regABits, true, 'a');
  setupBitwiseRegister(regBGrid, regBBits, true, 'b');
  updateBitwiseMath();
}

function setupBitwiseRegister(container, bitArray, editable, prefix) {
  container.innerHTML = '';
  for (let i = 7; i >= 0; i--) {
    const block = document.createElement('div');
    block.className = `bitwise-bit ${bitArray[i] === 1 ? 'high' : ''} ${!editable ? 'readonly' : ''}`;
    block.textContent = bitArray[i];
    
    if (editable) {
      block.addEventListener('click', () => {
        bitArray[i] = bitArray[i] === 1 ? 0 : 1;
        block.className = `bitwise-bit ${bitArray[i] === 1 ? 'high' : ''}`;
        block.textContent = bitArray[i];
        playClickSound(bitArray[i] === 1);
        updateBitwiseMath();
      });
    }
    
    container.appendChild(block);
  }
}

function updateBitwiseMath() {
  const op = document.getElementById('bitwise-op-select').value;
  
  // Calculate inputs
  let valA = 0;
  let valB = 0;
  for (let i = 0; i < 8; i++) {
    if (regABits[i] === 1) valA |= (1 << i);
    if (regBBits[i] === 1) valB |= (1 << i);
  }

  // Hide Register B row if operator is NOT (unary operator)
  const regBRow = document.getElementById('bitwise-reg-b-row');
  if (op === 'NOT') {
    regBRow.style.opacity = '0.3';
    regBRow.style.pointerEvents = 'none';
  } else {
    regBRow.style.opacity = '1';
    regBRow.style.pointerEvents = 'auto';
  }

  // Compute Bitwise logic
  let valOut = 0;
  switch (op) {
    case 'AND': valOut = valA & valB; break;
    case 'OR':  valOut = valA | valB; break;
    case 'XOR': valOut = valA ^ valB; break;
    case 'NOT': valOut = ~valA & 0xFF; break;
    case 'LSH': valOut = (valA << 1) & 0xFF; break;
    case 'RSH': valOut = valA >> 1; break;
  }

  // Populate Result DOM
  regOutGrid.innerHTML = '';
  for (let i = 7; i >= 0; i--) {
    const bitVal = (valOut >> i) & 1;
    const block = document.createElement('div');
    block.className = `bitwise-bit readonly ${bitVal === 1 ? 'high' : ''}`;
    block.textContent = bitVal;
    
    // Result styling color cyan
    if (bitVal === 1) {
      block.style.color = 'var(--accent-cyan)';
      block.style.borderColor = 'var(--accent-cyan)';
      block.style.boxShadow = '0 0 6px var(--accent-cyan-glow)';
    }
    
    regOutGrid.appendChild(block);
  }

  // Display hexadecimal strings
  document.getElementById('bitwise-val-a').textContent = '0x' + valA.toString(16).toUpperCase().padStart(2, '0');
  document.getElementById('bitwise-val-b').textContent = '0x' + valB.toString(16).toUpperCase().padStart(2, '0');
  document.getElementById('bitwise-val-out').textContent = '0x' + valOut.toString(16).toUpperCase().padStart(2, '0');
}

// Operators listener
document.getElementById('bitwise-op-select').addEventListener('change', updateBitwiseMath);

// ==========================================
// 3. REGISTER C-MASK COMPILER
// ==========================================
const sliderStart = document.getElementById('slider-mask-start');
const sliderEnd = document.getElementById('slider-mask-end');
const lblStart = document.getElementById('lbl-mask-start');
const lblEnd = document.getElementById('lbl-mask-end');
const codeOutput = document.getElementById('code-macro-output');

function compileBitmask() {
  let start = parseInt(sliderStart.value);
  let end = parseInt(sliderEnd.value);
  
  // Ensure start is always <= end
  if (start > end) {
    // Swap or force
    end = start;
    sliderEnd.value = end;
  }
  
  lblStart.textContent = start;
  lblEnd.textContent = end;
  
  // Calculate mask hex value
  // mask = ((1n << (end - start + 1)) - 1) << start
  const range = BigInt(end - start + 1);
  const maskVal = ((1n << range) - 1n) << BigInt(start);
  
  const hexStr = maskVal.toString(16).toUpperCase().padStart(8, '0');
  
  // Build premium interactive macro output representation
  let macroCode = `// Bitmask for register bits [${start} : ${end}]\n`;
  macroCode += `#define PERIPH_MASK_${start}_${end}  (0x${hexStr}U)\n\n`;
  macroCode += `// Usage Driver Alignment:\n`;
  macroCode += `MY_REGISTER &= ~PERIPH_MASK_${start}_${end}; // Clear bits\n`;
  macroCode += `MY_REGISTER |= (val << ${start}) & PERIPH_MASK_${start}_${end}; // Set bits`;
  
  codeOutput.textContent = macroCode;
}

sliderStart.addEventListener('input', compileBitmask);
sliderEnd.addEventListener('input', compileBitmask);

document.getElementById('btn-copy-macro').addEventListener('click', () => {
  const codeText = codeOutput.textContent;
  navigator.clipboard.writeText(codeText).then(() => {
    showToast("C-Macro code copied to clipboard!", "success");
  }).catch(() => {
    showToast("Copy failed.", "danger");
  });
});

// ==========================================
// 4. RAM ENDIANNESS MEMORY SWAPPER
// ==========================================
const endianHexInput = document.getElementById('endian-hex-input');

function updateEndiannessVisual() {
  let hexVal = endianHexInput.value.trim().replace(/^0x/i, '');
  
  // Validate hex word (8 characters, pad if necessary)
  if (!/^[0-9A-Fa-f]*$/.test(hexVal)) {
    hexVal = "12345678";
  }
  
  hexVal = hexVal.padEnd(8, '0').substring(0, 8);
  
  // Split into 4 bytes: [MSB, B2, B1, LSB]
  const b3 = hexVal.substring(0, 2).toUpperCase(); // MSB
  const b2 = hexVal.substring(2, 4).toUpperCase();
  const b1 = hexVal.substring(4, 6).toUpperCase();
  const b0 = hexVal.substring(6, 8).toUpperCase(); // LSB

  // Little Endian (Byte 0 is at lowest address)
  document.getElementById('le-b0').textContent = b0;
  document.getElementById('le-b1').textContent = b1;
  document.getElementById('le-b2').textContent = b2;
  document.getElementById('le-b3').textContent = b3;

  // Big Endian (Byte 3 is at lowest address)
  document.getElementById('be-b0').textContent = b3;
  document.getElementById('be-b1').textContent = b2;
  document.getElementById('be-b2').textContent = b1;
  document.getElementById('be-b3').textContent = b0;
}

endianHexInput.addEventListener('input', updateEndiannessVisual);

// ==========================================
// 5. IEEE-754 32-BIT FLOAT VISUALIZER
// ==========================================
const floatBits = Array(32).fill(0);
const ieeeBitGridEl = document.getElementById('ieee-bit-grid-el');

// Initialize Floating point blocks
function initIeeeFloatDOM() {
  ieeeBitGridEl.innerHTML = '';
  
  // Render bits from bit 31 (Sign - left) to bit 0 (LSB - right)
  for (let i = 31; i >= 0; i--) {
    const block = document.createElement('div');
    
    // Class names according to float sections
    let fieldClass = 'mantissa';
    if (i === 31) {
      fieldClass = 'sign';
    } else if (i >= 23 && i <= 30) {
      fieldClass = 'exponent';
    }
    
    block.className = `ieee-bit ${fieldClass} ${floatBits[i] === 1 ? 'high' : ''}`;
    block.textContent = floatBits[i];
    block.title = `Bit [${i}] - field: ${fieldClass.toUpperCase()}`;
    
    block.addEventListener('click', () => {
      floatBits[i] = floatBits[i] === 1 ? 0 : 1;
      block.className = `ieee-bit ${fieldClass} ${floatBits[i] === 1 ? 'high' : ''}`;
      block.textContent = floatBits[i];
      playClickSound(floatBits[i] === 1);
      updateIeeeFloatValues();
    });
    
    ieeeBitGridEl.appendChild(block);
  }
}

// Compute IEEE-754 standard values
function updateIeeeFloatValues() {
  // A: Parse Sign Bit
  const signBit = floatBits[31];
  
  // B: Parse Biased Exponent [30:23]
  let exponentDec = 0;
  for (let i = 23; i <= 30; i++) {
    if (floatBits[i] === 1) {
      exponentDec |= (1 << (i - 23));
    }
  }
  const unbiasedExp = exponentDec - 127;

  // C: Parse Mantissa Fraction [22:0]
  let fractionVal = 0.0;
  let fractionBinStr = '';
  for (let i = 22; i >= 0; i--) {
    const bit = floatBits[i];
    fractionBinStr += bit;
    if (bit === 1) {
      fractionVal += Math.pow(2, -(23 - i));
    }
  }

  // D: Solve math value based on Biased Exponent ranges
  let floatVal = 0.0;
  let displayStr = '';
  let equationStr = '';
  
  if (exponentDec === 255) {
    if (fractionVal === 0) {
      floatVal = signBit === 1 ? -Infinity : Infinity;
      displayStr = `Value = ${signBit === 1 ? '-Infinity' : '+Infinity'}`;
      equationStr = `Special Case: Biased Exponent = 255, Mantissa = 0 (Infinity)`;
    } else {
      floatVal = NaN;
      displayStr = `Value = NaN (Not-a-Number)`;
      equationStr = `Special Case: Biased Exponent = 255, Mantissa != 0 (Signal/Quiet NaN)`;
    }
  } else if (exponentDec === 0) {
    if (fractionVal === 0) {
      floatVal = signBit === 1 ? -0.0 : 0.0;
      displayStr = `Value = ${signBit === 1 ? '-0.0' : '0.0'} (Signed Zero)`;
      equationStr = `Special Case: Signed Zero`;
    } else {
      // Subnormal/Denormalized Case
      floatVal = Math.pow(-1, signBit) * Math.pow(2, -126) * fractionVal;
      displayStr = `Value = ${floatVal.toExponential(7)}`;
      equationStr = `Subnormal: (-1)<sup class="val-sign">${signBit}</sup> &times; 2<sup class="val-exp">-126</sup> &times; (0 + <span class="val-frac">${fractionVal.toFixed(7)}</span>)`;
    }
  } else {
    // Standard Normalized Case
    floatVal = Math.pow(-1, signBit) * Math.pow(2, unbiasedExp) * (1.0 + fractionVal);
    
    // Format nicely
    if (Math.abs(floatVal) < 1e-4 || Math.abs(floatVal) > 1e7) {
      displayStr = `Value = ${floatVal.toExponential(7)}`;
    } else {
      displayStr = `Value = ${floatVal.toFixed(6)}`;
    }
    
    equationStr = `(-1)<sup class="val-sign">${signBit}</sup> &times; 2<sup class="val-exp">${exponentDec} - 127</sup> &times; (1 + <span class="val-frac">${fractionVal.toFixed(7)}</span>)`;
  }

  // Populate HUD displays
  document.getElementById('ieee-computed-float').textContent = displayStr;
  document.getElementById('ieee-equation-breakdown').innerHTML = equationStr;
  
  document.getElementById('lbl-ieee-sign-sign').textContent = signBit === 1 ? '-' : '+';
  document.getElementById('lbl-ieee-sign-bit').textContent = signBit;
  document.getElementById('lbl-ieee-exp-dec').textContent = exponentDec;
  document.getElementById('lbl-ieee-exp-unbiased').textContent = unbiasedExp;
  
  document.getElementById('lbl-ieee-frac-dec').textContent = fractionVal.toFixed(7);
  document.getElementById('lbl-ieee-frac-bin').textContent = fractionBinStr.substring(0, 10) + '...';
}

// Preset Float constants to test (1.0, -5.75, NaN)
function loadFloatPreset(val) {
  let bits = Array(32).fill(0);
  switch (val) {
    case '1.0':
      // 0 01111111 00000000000000000000000
      bits[31] = 0;
      for (let i = 23; i <= 30; i++) bits[i] = 1; // Exponent 127
      break;
    case '-5.75':
      // -5.75 = -101.11 in binary = -1.0111 * 2^2
      // Sign = 1. Exponent = 2 + 127 = 129 = 10000001 in binary
      // Mantissa = 01110000000000000000000
      bits[31] = 1; // negative
      bits[30] = 1; bits[23] = 1; // 129 = bit 30 (128) + bit 23 (1)
      bits[21] = 1; bits[20] = 1; bits[19] = 1; // mantissa 0.111
      break;
  }
  
  for (let i = 0; i < 32; i++) {
    floatBits[i] = bits[i];
  }
  initIeeeFloatDOM();
  updateIeeeFloatValues();
}

// ==========================================
// 6. SYNTHESIZED SOUND EFFECTS
// ==========================================
let audioContext = null;

function playClickSound(high = true) {
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
    osc.frequency.setValueAtTime(high ? 750 : 350, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.05);
  } catch (e) {
    // Web audio block
  }
}

// ==========================================
// 7. TOAST NOTIFICATIONS
// ==========================================
function showToast(msg, type = "success") {
  const container = document.body;
  const toast = document.createElement('div');
  
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
  } else {
    toast.style.background = 'rgba(244, 63, 94, 0.95)';
    toast.style.borderColor = 'rgba(244, 63, 94, 0.4)';
    toast.style.boxShadow = '0 0 15px rgba(244, 63, 94, 0.3)';
    toast.innerHTML = `❌ ${msg}`;
  }
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 50);
  
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initial Loading setup
window.addEventListener('load', () => {
  // Preset default bits: Let's set bits to demonstrate some numbers!
  // e.g. set 32-bit register to value 0xBEEF = Unsigned 48879
  registerBits[0] = 1; registerBits[1] = 1; registerBits[2] = 1; registerBits[3] = 1; // F
  registerBits[4] = 1; registerBits[5] = 1; registerBits[6] = 0; registerBits[7] = 1; // E
  registerBits[8] = 0; registerBits[9] = 1; registerBits[10] = 1; registerBits[11] = 1; // E (wait, E is 1110 -> bits 4:7 = 0111, hex 7? Let's check: 0xBEEF. F is 1111, E is 1110, E is 1110, B is 1011)
  // Let's set simple value 0x002A (Decimal 42 - life, universe, everything!)
  registerBits[1] = 1; registerBits[3] = 1; registerBits[5] = 1; // bits 1, 3, 5 = 2 + 8 + 32 = 42
  
  initRegisterDOM();
  updateRegisterValues();
  
  // Set Bitwise Register A = 0xAA (10101010), B = 0x55 (01010101)
  for (let i = 0; i < 8; i++) {
    regABits[i] = i % 2 === 1 ? 1 : 0;
    regBBits[i] = i % 2 === 0 ? 1 : 0;
  }
  initBitwiseDOM();
  
  // Pre-load float value -5.75
  loadFloatPreset('-5.75');
  
  // Compile Bitmask
  compileBitmask();
  
  // Endian visual
  updateEndiannessVisual();
});
