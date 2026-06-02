// PROTOCOL.OS - Programmatic Simulator Timing Grid & Frame Parity Logic Validator

const assert = require('assert');

console.log("=========================================================");
console.log("PROTOCOL.OS - PROGRAMMATIC TEST SANITY HARNESS RUNNING");
console.log("=========================================================\n");

// Test 1: UART Parity bit generator helper logic
function calculateUartParity(charCode, parityType) {
  let oneBitsCount = 0;
  for (let i = 0; i < 8; i++) {
    const bit = (charCode >> i) & 1;
    if (bit === 1) oneBitsCount++;
  }
  let parityBit = 0;
  if (parityType === 'even') {
    parityBit = (oneBitsCount % 2 === 0) ? 0 : 1;
  } else if (parityType === 'odd') {
    parityBit = (oneBitsCount % 2 !== 0) ? 0 : 1;
  }
  return parityBit;
}

try {
  console.log("Running Test 1: UART Parity computation...");
  // ASCII 'M' is 77, binary 01001101 (4 bits set)
  // Even parity for 4 bits: parity bit should be 0
  // Odd parity for 4 bits: parity bit should be 1
  assert.strictEqual(calculateUartParity(77, 'even'), 0, "Even parity for ASCII 'M' should be 0");
  assert.strictEqual(calculateUartParity(77, 'odd'), 1, "Odd parity for ASCII 'M' should be 1");
  
  // ASCII 'A' is 65, binary 01000001 (2 bits set)
  // Even parity: 0, Odd parity: 1
  assert.strictEqual(calculateUartParity(65, 'even'), 0, "Even parity for ASCII 'A' should be 0");
  assert.strictEqual(calculateUartParity(65, 'odd'), 1, "Odd parity for ASCII 'A' should be 1");
  
  console.log("✅ Test 1 Passed: UART Parity calculations correct.");
} catch (e) {
  console.error("❌ Test 1 Failed:", e.message);
  process.exit(1);
}

// Test 2: I2C Bit layout splitting
function splitI2CAddress(addr) {
  let bits = [];
  for (let i = 6; i >= 0; i--) {
    bits.push((addr >> i) & 1);
  }
  return bits;
}

try {
  console.log("Running Test 2: I2C 7-bit Address parser...");
  const addrBits = splitI2CAddress(0x2A); // Binary: 0101010
  assert.deepStrictEqual(addrBits, [0, 1, 0, 1, 0, 1, 0], "Address 0x2A should split to [0,1,0,1,0,1,0]");
  console.log("✅ Test 2 Passed: I2C 7-bit address splitting correct.");
} catch (e) {
  console.error("❌ Test 2 Failed:", e.message);
  process.exit(1);
}

// Test 3: SPI MSB vs LSB order splitting
function splitSPIByte(data, order) {
  let bits = [];
  for (let i = 7; i >= 0; i--) {
    const idx = order === 'msb' ? i : (7 - i);
    bits.push((data >> idx) & 1);
  }
  return bits;
}

try {
  console.log("Running Test 3: SPI bit shifting order parser...");
  const msbBits = splitSPIByte(0xAA, 'msb'); // 0xAA is 10101010
  const lsbBits = splitSPIByte(0xAA, 'lsb'); // Reversed: 01010101 (since 0xAA shifted opposite becomes 0x55)
  
  assert.deepStrictEqual(msbBits, [1, 0, 1, 0, 1, 0, 1, 0], "0xAA MSB should be [1,0,1,0,1,0,1,0]");
  assert.deepStrictEqual(lsbBits, [0, 1, 0, 1, 0, 1, 0, 1], "0xAA LSB should be [0,1,0,1,0,1,0,1]");
  console.log("✅ Test 3 Passed: SPI bit orders correct.");
} catch (e) {
  console.error("❌ Test 3 Failed:", e.message);
  process.exit(1);
}

console.log("\n=========================================================");
console.log("✅ ALL PROTOCOL STATE MACHINE TESTS PASSED SUCCESSFULLY");
console.log("=========================================================");
