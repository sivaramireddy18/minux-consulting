// MEM.OS - Embedded Memory Allocation & Compiler Simulator - Core Script

// ==========================================
// 1. C-CODE PRESETS & DATA MODELS
// ==========================================

const CODE_PRESETS = {
  globals_boot: {
    title: "Storage Classes & Globals",
    code: [
      `#define LED_PIN      5`,
      `#define SYS_SPEED    16000000U`,
      ``,
      `const char* header = "BOOT";  // .rodata`,
      `static int cycles = 15;      // .data static`,
      `volatile int state = 1;      // .data volatile`,
      `static char error_log[4];    // .bss static`,
      `extern int global_tick;      // External reference`,
      ``,
      `int main(void) {`,
      `    register int local_cycles; // CPU register`,
      `    auto int temp = 0;         // Stack auto`,
      `    `,
      `    local_cycles = cycles;`,
      `    temp = local_cycles + 10;`,
      `    `,
      `    state = 0; // Toggle volatile`,
      `    return 0;`,
      `}`
    ],
    preprocessed: [
      `// Preprocessed C Output (gcc -E)`,
      `// Macros LED_PIN and SYS_SPEED are expanded`,
      `const char* header = "BOOT";`,
      `static int cycles = 15;`,
      `volatile int state = 1;`,
      `static char error_log[4];`,
      `extern int global_tick;`,
      ``,
      `int main(void) {`,
      `    register int local_cycles;`,
      `    auto int temp = 0;`,
      `    `,
      `    local_cycles = cycles;`,
      `    temp = local_cycles + 10;`,
      `    `,
      `    state = 0;`,
      `    return 0;`,
      `}`
    ],
    assembly: [
      `.section .rodata`,
      `header:   .word .LC0`,
      `.LC0:     .ascii "BOOT\\0"`,
      ``,
      `.section .data`,
      `cycles:   .word 15`,
      `state:    .word 1`,
      ``,
      `.section .bss`,
      `.lcomm error_log, 4`,
      ``,
      `.section .text`,
      `.global main`,
      `main:`,
      `    PUSH {r4, lr}        @ Save link register`,
      `    MOV r0, #0           @ temp = 0`,
      `    LDR r4, =cycles      @ Load address of cycles`,
      `    LDR r1, [r4]         @ r1 = local_cycles`,
      `    ADD r0, r1, #10      @ temp = local_cycles + 10`,
      `    LDR r2, =state       @ Load volatile state address`,
      `    MOV r3, #0`,
      `    STR r3, [r2]         @ Write state = 0 (direct RAM)`,
      `    MOV r0, #0           @ Return 0`,
      `    POP {r4, pc}         @ Restore stack frame`,
    ],
    object: [
      `00000000 <main>:`,
      `   0: e92d4010  push  {r4, lr}`,
      `   4: e3a00000  mov   r0, #0`,
      `   8: e59f4014  ldr   r4, [pc, #20] ; loading cycles`,
      `   c: e5941000  ldr   r1, [r4]      ; r1 (local_cycles)`,
      `  10: e281000a  add   r0, r1, #10`,
      `  14: e59f200c  ldr   r2, [pc, #12] ; loading state`,
      `  18: e3a03000  mov   r3, #0`,
      `  1c: e5823000  str   r3, [r2]      ; direct RAM write`,
      `  20: e3a00000  mov   r0, #0`,
      `  24: e8bd8010  pop   {r4, pc}`
    ],
    linker: `/* Linker Script Map (linker.ld) */\nMEMORY {\n  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 256K\n  SRAM (rwx) : ORIGIN = 0x20000000, LENGTH = 32K\n}\n\nSECTIONS {\n  .text :   { *(.text) } > FLASH\n  .rodata : { *(.rodata) } > FLASH\n  .data :   { *(.data) } > SRAM AT> FLASH\n  .bss :    { *(.bss) } > SRAM\n}`,
    binaryMap: `/* Segment absolute mappings in MCU Flash/RAM */\n\n[FLASH AT 0x08000000]\n0x08000000 - 0x08000028 : .text (main)\n0x08000028 - 0x08000034 : .rodata ("BOOT")\n\n[RAM AT 0x20000000]\n0x20000000 - 0x20000004 : .data (cycles)\n0x20000004 - 0x20000008 : .data (state)\n0x20000008 - 0x2000000C : .bss  (error_log)`
  },
  
  stack_recursion: {
    title: "Recursive Deep Stack",
    code: [
      `int result = 0;              // .bss`,
      ``,
      `int calc_factorial(int n) {`,
      `    auto int local_n = n;`,
      `    if (local_n <= 1) {`,
      `        return 1;`,
      `    }`,
      `    return local_n * calc_factorial(local_n - 1);`,
      `}`,
      ``,
      `int main(void) {`,
      `    result = calc_factorial(3);`,
      `    return 0;`,
      `}`
    ],
    preprocessed: [
      `// Preprocessed C Output (gcc -E)`,
      `int result = 0;`,
      ``,
      `int calc_factorial(int n) {`,
      `    auto int local_n = n;`,
      `    if (local_n <= 1) {`,
      `        return 1;`,
      `    }`,
      `    return local_n * calc_factorial(local_n - 1);`,
      `}`,
      ``,
      `int main(void) {`,
      `    result = calc_factorial(3);`,
      `    return 0;`,
      `}`
    ],
    assembly: [
      `.section .bss`,
      `result:   .space 4`,
      ``,
      `.section .text`,
      `.global calc_factorial`,
      `calc_factorial:`,
      `    PUSH {r4, lr}        @ Push Stack Frame`,
      `    MOV r4, r0           @ r4 = local_n = n`,
      `    CMP r4, #1           @ Compare n with 1`,
      `    BGT .L_recurse       @ If n > 1, branch to recurse`,
      `    MOV r0, #1           @ Base case return 1`,
      `    POP {r4, pc}         @ Pop frame`,
      `.L_recurse:`,
      `    SUB r0, r4, #1       @ n - 1`,
      `    BL calc_factorial    @ Recursive Call`,
      `    MUL r0, r0, r4       @ return n * factorial(n-1)`,
      `    POP {r4, pc}         @ Pop frame`,
      ``,
      `.global main`,
      `main:`,
      `    PUSH {lr}`,
      `    MOV r0, #3           @ Argument n = 3`,
      `    BL calc_factorial`,
      `    LDR r1, =result`,
      `    STR r0, [r1]         @ Save result`,
      `    MOV r0, #0`,
      `    POP {pc}`
    ],
    object: [
      `00000000 <calc_factorial>:`,
      `   0: e92d4010  push  {r4, lr}`,
      `   4: e1a04000  mov   r4, r0`,
      `   8: e3540001  cmp   r4, #1`,
      `   c: ca000002  bgt   1c <.L_recurse>`,
      `  10: e3a00001  mov   r0, #1`,
      `  14: e8bd8010  pop   {r4, pc}`,
      `0000001c <.L_recurse>:`,
      `  1c: e2440001  sub   r0, r4, #1`,
      `  20: ebfffffa  bl    0 <calc_factorial>`,
      `  24: e0000094  mul   r0, r0, r4`,
      `  28: e8bd8010  pop   {r4, pc}`
    ],
    linker: `/* Linker Script Map (linker.ld) */\nMEMORY {\n  FLASH (rx) : ORIGIN = 0x08000000\n  SRAM (rwx) : ORIGIN = 0x20000000\n}\nSECTIONS {\n  .text : { *(.text) } > FLASH\n  .bss :  { *(.bss) } > SRAM\n}`,
    binaryMap: `/* Segment absolute mappings in MCU Flash/RAM */\n\n[FLASH AT 0x08000000]\n0x08000000 - 0x0800002C : .text (calc_factorial)\n0x0800002C - 0x0800003C : .text (main)\n\n[RAM AT 0x20000000]\n0x20000000 - 0x20000004 : .bss  (result)`
  },
  
  heap_malloc: {
    title: "Dynamic Heap Allocation",
    code: [
      `#define NULL   (void*)0`,
      `char* buffer = NULL;         // .bss pointer`,
      ``,
      `int main(void) {`,
      `    // Allocate 4 bytes on dynamic heap`,
      `    buffer = (char*)malloc(4 * sizeof(char));`,
      `    `,
      `    if (buffer != NULL) {`,
      `        buffer[0] = 'M';`,
      `        buffer[1] = 'C';`,
      `        buffer[2] = 'U';`,
      `        buffer[3] = '\\0';`,
      `    }`,
      `    `,
      `    free(buffer);            // Release heap chunk`,
      `    buffer = NULL;`,
      `    return 0;`,
      `}`
    ],
    preprocessed: [
      `// Preprocessed C Output (gcc -E)`,
      `char* buffer = (void*)0;`,
      ``,
      `int main(void) {`,
      `    buffer = (char*)malloc(4 * 1);`,
      `    `,
      `    if (buffer != (void*)0) {`,
      `        buffer[0] = 'M';`,
      `        buffer[1] = 'C';`,
      `        buffer[2] = 'U';`,
      `        buffer[3] = '\\0';`,
      `    }`,
      `    `,
      `    free(buffer);`,
      `    buffer = (void*)0;`,
      `    return 0;`,
      `}`
    ],
    assembly: [
      `.section .bss`,
      `buffer:   .space 4`,
      ``,
      `.section .text`,
      `.global main`,
      `main:`,
      `    PUSH {r4, lr}`,
      `    MOV r0, #4           @ Argument size = 4`,
      `    BL malloc            @ Allocate Heap chunk`,
      `    MOV r4, r0           @ Save pointer in r4`,
      `    LDR r1, =buffer`,
      `    STR r4, [r1]         @ buffer = malloc(4)`,
      `    CMP r4, #0           @ Check if NULL`,
      `    BEQ .L_exit`,
      `    MOV r0, #77          @ 'M'`,
      `    STRB r0, [r4, #0]`,
      `    MOV r0, #67          @ 'C'`,
      `    STRB r0, [r4, #1]`,
      `    MOV r0, #85          @ 'U'`,
      `    STRB r0, [r4, #2]`,
      `    MOV r0, #0           @ '\\0'`,
      `    STRB r0, [r4, #3]`,
      `.L_exit:`,
      `    MOV r0, r4           @ Argument pointer`,
      `    BL free              @ Deallocate`,
      `    LDR r1, =buffer`,
      `    MOV r0, #0`,
      `    STR r0, [r1]         @ buffer = NULL`,
      `    POP {r4, pc}`
    ],
    object: [
      `00000000 <main>:`,
      `   0: e92d4010  push  {r4, lr}`,
      `   4: e3a00004  mov   r0, #4`,
      `   8: ebfffffe  bl    0 <malloc>`,
      `   c: e1a04000  mov   r4, r0`,
      `  10: e59f1028  ldr   r1, [pc, #40] ; loading buffer`,
      `  14: e5814000  str   r4, [r1]`,
      `  18: e3540000  cmp   r4, #0`,
      `  1c: 0a000006  beq   3c <.L_exit>`,
      `  20: e3a0004d  mov   r0, #77 ; 'M'`,
      `  24: e5c40000  strb  r0, [r4]`,
      `  28: e3a00043  mov   r0, #67 ; 'C'`,
      `  2c: e5c40001  strb  r0, [r4, #1]`,
      `  30: e3a00055  mov   r0, #85 ; 'U'`,
      `  34: e5c40002  strb  r0, [r4, #2]`,
      `  38: e3a00000  mov   r0, #0`,
      `  3c: e5c40003  strb  r0, [r4, #3]`,
      `0000003c <.L_exit>:`,
      `  40: e1a00004  mov   r0, r4`,
      `  44: ebfffffe  bl    0 <free>`,
      `  48: e5810000  str   r0, [r1]`
    ],
    linker: `/* Linker Script Map (linker.ld) */\nMEMORY {\n  FLASH (rx) : ORIGIN = 0x08000000\n  SRAM (rwx) : ORIGIN = 0x20000000\n}\nSECTIONS {\n  .text : { *(.text) } > FLASH\n  .bss :  { *(.bss) } > SRAM\n}`,
    binaryMap: `/* Segment absolute mappings in MCU Flash/RAM */\n\n[FLASH AT 0x08000000]\n0x08000000 - 0x0800004C : .text (main)\n\n[RAM AT 0x20000000]\n0x20000000 - 0x20000004 : .bss  (buffer)\n0x20001000 - 0x20001020 : Heap allocation region`
  }
};

// ==========================================
// 2. COMPILATION PROCESS TIMELINE SOLVER
// ==========================================
let compileModalActive = false;
let currentCompileStage = 1;
let currentPresetKey = 'globals_boot';

const compilationModal = document.getElementById('compilation-modal');
const btnBuild = document.getElementById('btn-compiler-build');
const btnNextStage = document.getElementById('btn-next-compile-stage');

const timelineProgress = document.getElementById('compiler-connector-progress');
const leftViewerTitle = document.getElementById('lbl-viewer-left');
const rightViewerTitle = document.getElementById('lbl-viewer-right');
const leftViewerBox = document.getElementById('box-viewer-left');
const rightViewerBox = document.getElementById('box-viewer-right');

function triggerCompilationPipeline() {
  currentCompileStage = 1;
  compileModalActive = true;
  compilationModal.classList.add('active');
  updateCompileStageView();
}

function updateCompileStageView() {
  const preset = CODE_PRESETS[currentPresetKey];
  const sourceCodeStr = preset.code.join('\n');
  
  // Reset all active nodes in timeline SVG/HTML
  for (let i = 1; i <= 4; i++) {
    const node = document.getElementById(`node-stage-${i}`);
    node.classList.toggle('active', i <= currentCompileStage);
  }
  
  // Update progress bar
  const progressPercent = ((currentCompileStage - 1) / 3) * 100;
  timelineProgress.style.width = `${progressPercent}%`;

  // Render comparative outputs
  switch (currentCompileStage) {
    case 1: // Preprocessor Stage
      leftViewerTitle.innerText = "Source Code (C File)";
      rightViewerTitle.innerText = "Preprocessor Output (-E)";
      
      leftViewerBox.textContent = sourceCodeStr;
      rightViewerBox.textContent = preset.preprocessed.join('\n');
      btnNextStage.innerText = "Execute Compiler (Stage 2) →";
      break;
      
    case 2: // Compiler Stage
      leftViewerTitle.innerText = "Preprocessor Output (-E)";
      rightViewerTitle.innerText = "ARM Assembly Output (-S)";
      
      leftViewerBox.textContent = preset.preprocessed.join('\n');
      rightViewerBox.textContent = preset.assembly.join('\n');
      btnNextStage.innerText = "Execute Assembler (Stage 3) →";
      break;
      
    case 3: // Assembler Stage
      leftViewerTitle.innerText = "ARM Assembly Output (-S)";
      rightViewerTitle.innerText = "Object Machine Code Bytes (.o)";
      
      leftViewerBox.textContent = preset.assembly.join('\n');
      rightViewerBox.textContent = preset.object.join('\n');
      btnNextStage.innerText = "Execute Linker Script (Stage 4) →";
      break;
      
    case 4: // Linker Stage
      leftViewerTitle.innerText = "Linker Script Configuration (linker.ld)";
      rightViewerTitle.innerText = "Final ELF Output Memory Map (-o)";
      
      leftViewerBox.textContent = preset.linker;
      rightViewerBox.textContent = preset.binaryMap;
      btnNextStage.innerText = "Finish & Load Debugger ⚡";
      break;
  }
}

btnNextStage.addEventListener('click', () => {
  if (currentCompileStage < 4) {
    currentCompileStage++;
    playClickSound(true);
    updateCompileStageView();
  } else {
    // Finish compile, load simulator
    compilationModal.classList.remove('active');
    compileModalActive = false;
    playClickSound(true);
    
    // Enable debug stepping controls
    document.getElementById('btn-debugger-step').disabled = false;
    document.getElementById('btn-debugger-reset').disabled = false;
    
    initializeProgramSimulation();
    showToast("Program successfully compiled and mapped to SRAM/FLASH!", "success");
  }
});

// ==========================================
// 3. CODE EDITOR & STEP DEBUGGER ENGINE
// ==========================================
const codeLinesContainer = document.getElementById('code-lines-container');
const dropdownSnippet = document.getElementById('code-snippet-select');

let debuggerActiveLine = -1; // -1 means loaded, not started
let simulationStepIndex = 0;
let programActive = false;

// CPU register objects
const cpuRegisters = { r0: 0, r1: 0, r2: 0, r3: 0 };
// Symbol tables data arrays
let activeSymbols = [];

function loadSelectedPreset() {
  currentPresetKey = dropdownSnippet.value;
  const lines = CODE_PRESETS[currentPresetKey].code;
  
  codeLinesContainer.innerHTML = '';
  lines.forEach((line, idx) => {
    const row = document.createElement('div');
    row.className = 'code-line-row';
    row.id = `code-line-${idx}`;
    
    const num = document.createElement('span');
    num.className = 'code-line-num';
    num.textContent = idx + 1;
    
    const text = document.createElement('span');
    text.className = 'code-line-text';
    text.textContent = line;
    
    row.appendChild(num);
    row.appendChild(text);
    codeLinesContainer.appendChild(row);
  });

  // Disable debugging buttons until compiled
  document.getElementById('btn-debugger-step').disabled = true;
  document.getElementById('btn-debugger-reset').disabled = true;
  
  // Wipe visual memory maps
  resetMemorySimHTML();
  
  // Print log
  writeGdbLog("Debugger initialized. Select C snippet and click 'Build / Compile' to run.");
}

dropdownSnippet.addEventListener('change', loadSelectedPreset);
btnBuild.addEventListener('click', triggerCompilationPipeline);

// ==========================================
// 4. MEMORY MANAGER SIMULATION ENGINE
// ==========================================
const ramStackContainer = document.getElementById('ram-stack-container');
const ramHeapContainer = document.getElementById('ram-heap-container');
const ramDataContainer = document.getElementById('ram-data-segment-container');
const ramBssContainer = document.getElementById('ram-bss-segment-container');

const flashTextContainer = document.getElementById('flash-text-instructions');
const flashRodataContainer = document.getElementById('flash-rodata-constants');

const preprocessorContainer = document.getElementById('preprocessor-macros-container');
const symbolTableBody = document.getElementById('symbol-table-body');

function resetMemorySimHTML() {
  ramStackContainer.innerHTML = '<div class="ram-lbl-addr" style="text-align:right; font-size:0.6rem; border-bottom:1px dashed rgba(244,63,94,0.3); padding-bottom:2px; margin-bottom:4px;">SRAM High (0x20008000) &darr; Stack Grows Down</div>';
  ramHeapContainer.innerHTML = '<div class="ram-lbl-addr" style="font-size:0.6rem; border-top:1px dashed rgba(99,102,241,0.3); padding-top:2px; margin-top:4px;">Heap Grows Up &uarr; SRAM Low (0x20001000)</div>';
  ramDataContainer.innerHTML = '';
  ramBssContainer.innerHTML = '';
  flashTextContainer.innerHTML = '';
  flashRodataContainer.innerHTML = '';
  preprocessorContainer.innerHTML = '';
  symbolTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-dark);">Symbol registry empty. Compile code to populate.</td></tr>';
  
  // Clear CPU Registers
  updateCpuRegistersHud({ r0: 0, r1: 0, r2: 0, r3: 0 });
  document.getElementById('warning-stack-overflow').style.display = 'none';
}

function initializeProgramSimulation() {
  resetMemorySimHTML();
  debuggerActiveLine = -1;
  simulationStepIndex = 0;
  programActive = true;
  activeSymbols = [];

  // 1. Map FLASH Vectors & Static code functions
  if (currentPresetKey === 'globals_boot') {
    // Populate Preprocessor Macros
    addPreprocessorMacro('LED_PIN', '5');
    addPreprocessorMacro('SYS_SPEED', '16000000U');

    // Populate FLASH .rodata
    addFlashRodata('header', '0x08000028', '"BOOT" (string literal)');
    
    // Populate FLASH .text
    addFlashText('main()', '0x08000000', 'CPU Instructions');

    // Register active global symbols into symbol list
    activeSymbols.push({ name: 'header', storage: 'const', segment: '.rodata', addr: '0x08000028', val: '0x0800002C ("BOOT")' });
    activeSymbols.push({ name: 'cycles', storage: 'static', segment: '.data', addr: '0x20000000', val: '15' });
    activeSymbols.push({ name: 'state', storage: 'volatile', segment: '.data', addr: '0x20000004', val: '1' });
    activeSymbols.push({ name: 'error_log', storage: 'static', segment: '.bss', addr: '0x20000008', val: '0x00000000 (zeros)' });
    activeSymbols.push({ name: 'global_tick', storage: 'extern', segment: 'external', addr: 'LINK_TIME_REF', val: 'undefined' });

    // Populate SRAM `.data` & `.bss` base segment allocations
    addRamDataBlock('cycles', '0x20000000', '15', false);
    addRamDataBlock('state', '0x20000004', '1', true); // volatile highlight
    addRamBssBlock('error_log', '0x20000008', '0x00000000');

  } else if (currentPresetKey === 'stack_recursion') {
    // FLASH `.text`
    addFlashText('calc_factorial()', '0x08000000', 'CPU Instructions');
    addFlashText('main()', '0x0800002C', 'CPU Instructions');
    
    // SRAM `.bss`
    addRamBssBlock('result', '0x20000000', '0');
    
    activeSymbols.push({ name: 'result', storage: 'global', segment: '.bss', addr: '0x20000000', val: '0' });

  } else if (currentPresetKey === 'heap_malloc') {
    addPreprocessorMacro('NULL', '(void*)0');
    addFlashText('main()', '0x08000000', 'CPU Instructions');
    addRamBssBlock('buffer', '0x20000000', '0x00000000 (NULL)');
    
    activeSymbols.push({ name: 'buffer', storage: 'global', segment: '.bss', addr: '0x20000000', val: '0x00000000 (NULL)' });
  }

  updateSymbolTableHTML();
  writeGdbLog("target remote localhost:3333\nRemote connection established.\nLoading target binaries... OK\nReset Handler executed. PC set to main() entry.");
}

// Debugger step engine state machine
document.getElementById('btn-debugger-step').addEventListener('click', () => {
  if (!programActive) return;
  playClickSound(true);
  
  // Advance code instruction pointer
  executeNextDebuggerStep();
});

document.getElementById('btn-debugger-reset').addEventListener('click', () => {
  playClickSound(false);
  loadSelectedPreset();
  showToast("Debugger reset successfully.", "warning");
});

function executeNextDebuggerStep() {
  const preset = CODE_PRESETS[currentPresetKey];
  
  // Remove previous highlighting
  if (debuggerActiveLine >= 0) {
    const prev = document.getElementById(`code-line-${debuggerActiveLine}`);
    if (prev) prev.classList.remove('executing');
  }

  // State calculations based on preset steps
  if (currentPresetKey === 'globals_boot') {
    // ----------------------------------------
    // GLOBALS BOOT & STORAGE CLASSES STEPS
    // ----------------------------------------
    switch (simulationStepIndex) {
      case 0:
        debuggerActiveLine = 9; // int main(void)
        writeGdbLog("Breakpoint 1 hit, main () at boot.c:10\nStack Pointer (SP) set to 0x20007FF8");
        pushStackFrame('main()', '0x20007FF8', [{ name: 'cycles_ref', val: '0x20000000' }]);
        break;
      case 1:
        debuggerActiveLine = 10; // register int local_cycles;
        writeGdbLog("Scanned storage class 'register'. Reserving CPU register R1 instead of SRAM stack space!");
        highlightCpuRegister('r1', true);
        break;
      case 2:
        debuggerActiveLine = 11; // auto int temp = 0;
        writeGdbLog("Pushed auto local variable 'temp' onto current stack frame.");
        addStackVariable('main()', 'temp', '0');
        // Update symbol
        activeSymbols.push({ name: 'temp', storage: 'auto', segment: 'stack', addr: '0x20007FF4', val: '0' });
        break;
      case 3:
        debuggerActiveLine = 13; // local_cycles = cycles;
        writeGdbLog("LDR r1, [cycles] -> CPU Register r1 updated to value 15");
        updateCpuRegistersHud({ r1: 15 });
        updateSymbolVal('temp', '0'); // no change
        break;
      case 4:
        debuggerActiveLine = 14; // temp = local_cycles + 10;
        writeGdbLog("ADD r0, r1, #10 -> temp updated on Stack to 25");
        updateStackVariableVal('main()', 'temp', '25');
        updateSymbolVal('temp', '25');
        break;
      case 5:
        debuggerActiveLine = 16; // state = 0;
        writeGdbLog("Volatile write triggered: Bypassing registry buffers. STR state, #0 (direct SRAM write!).");
        updateRamDataValue('state', '0');
        updateSymbolVal('state', '0');
        break;
      case 6:
        debuggerActiveLine = 17; // return 0;
        writeGdbLog("Exit main() frame. Popping stack frame from RAM.");
        popStackFrame();
        // Remove local temp symbol
        activeSymbols = activeSymbols.filter(s => s.name !== 'temp');
        highlightCpuRegister('r1', false);
        break;
      default:
        writeGdbLog("Program exited normally.");
        debuggerActiveLine = -1;
        document.getElementById('btn-debugger-step').disabled = true;
        programActive = false;
        showToast("End of instruction trace reached.", "warning");
        break;
    }
    
  } else if (currentPresetKey === 'stack_recursion') {
    // ----------------------------------------
    // RECURSIVE STACK STEPS
    // ----------------------------------------
    switch (simulationStepIndex) {
      case 0:
        debuggerActiveLine = 10; // int main(void)
        writeGdbLog("main() entry. Pushing frame.");
        pushStackFrame('main()', '0x20007FF8', []);
        break;
      case 1:
        debuggerActiveLine = 11; // result = calc_factorial(3);
        writeGdbLog("BL calc_factorial(3) -> Pushing recursive Stack Frame [depth: 1]");
        pushStackFrame('factorial(n=3)', '0x20007FD0', [{ name: 'local_n', val: '3' }]);
        activeSymbols.push({ name: 'n (depth 1)', storage: 'auto', segment: 'stack', addr: '0x20007FCC', val: '3' });
        break;
      case 2:
        debuggerActiveLine = 2; // int calc_factorial(int n)
        writeGdbLog("Checking branch conditional. n > 1 holds. Recurse factorial(n=2).");
        break;
      case 3:
        debuggerActiveLine = 7; // return n * calc_factorial(n - 1);
        writeGdbLog("BL calc_factorial(2) -> Pushing recursive Stack Frame [depth: 2]");
        pushStackFrame('factorial(n=2)', '0x20007FA8', [{ name: 'local_n', val: '2' }]);
        activeSymbols.push({ name: 'n (depth 2)', storage: 'auto', segment: 'stack', addr: '0x20007FA4', val: '2' });
        break;
      case 4:
        debuggerActiveLine = 2; // calc_factorial(2)
        writeGdbLog("n > 1 holds. Recurse factorial(n=1).");
        break;
      case 5:
        debuggerActiveLine = 7; // factorial(n - 1)
        writeGdbLog("BL calc_factorial(1) -> Pushing recursive Stack Frame [depth: 3]");
        pushStackFrame('factorial(n=1)', '0x20007F80', [{ name: 'local_n', val: '1' }]);
        activeSymbols.push({ name: 'n (depth 3)', storage: 'auto', segment: 'stack', addr: '0x20007F7C', val: '1' });
        break;
      case 6:
        debuggerActiveLine = 4; // if (local_n <= 1)
        writeGdbLog("Base Case Hit! n <= 1 is true. Preparing to return 1.");
        break;
      case 7:
        debuggerActiveLine = 5; // return 1;
        writeGdbLog("Popping factorial(n=1) frame from stack. Returning value 1.");
        popStackFrame();
        activeSymbols = activeSymbols.filter(s => s.name !== 'n (depth 3)');
        updateCpuRegistersHud({ r0: 1 });
        break;
      case 8:
        debuggerActiveLine = 7; // return n * calc_factorial(n-1) [depth 2]
        writeGdbLog("Unwinding recursion: n=2 * return_val=1. Popping factorial(n=2) frame. Returning 2.");
        popStackFrame();
        activeSymbols = activeSymbols.filter(s => s.name !== 'n (depth 2)');
        updateCpuRegistersHud({ r0: 2 });
        break;
      case 9:
        debuggerActiveLine = 7; // return n * calc_factorial(n-1) [depth 1]
        writeGdbLog("Unwinding recursion: n=3 * return_val=2. Popping factorial(n=3) frame. Returning 6.");
        popStackFrame();
        activeSymbols = activeSymbols.filter(s => s.name !== 'n (depth 1)');
        updateCpuRegistersHud({ r0: 6 });
        break;
      case 10:
        debuggerActiveLine = 11; // result = ...
        writeGdbLog("Saving output result into SRAM uninitialized .bss section! result updated to 6.");
        updateRamBssValue('result', '6');
        updateSymbolVal('result', '6');
        break;
      case 11:
        debuggerActiveLine = 12; // return 0;
        writeGdbLog("Popping main() frame. Execution finished.");
        popStackFrame();
        break;
      default:
        writeGdbLog("Program exited normally.");
        debuggerActiveLine = -1;
        document.getElementById('btn-debugger-step').disabled = true;
        programActive = false;
        showToast("End of instruction trace reached.", "warning");
        break;
    }

  } else if (currentPresetKey === 'heap_malloc') {
    // ----------------------------------------
    // DYNAMIC HEAP MALLOC STEPS
    // ----------------------------------------
    switch (simulationStepIndex) {
      case 0:
        debuggerActiveLine = 3; // int main(void)
        writeGdbLog("main() entry. SP set to 0x20007FF8");
        pushStackFrame('main()', '0x20007FF8', []);
        break;
      case 1:
        debuggerActiveLine = 5; // buffer = malloc(4)
        writeGdbLog("BL malloc (size=4). Searching heap region. Allocating Block 1 at Low address 0x20001008");
        addHeapBlock('Block1', '0x20001008', '4 bytes', 'uninitialized');
        updateRamBssValue('buffer', '0x20001008 (Heap Pointer)');
        updateSymbolVal('buffer', '0x20001008 (Heap Pointer)');
        activeSymbols.push({ name: 'malloc block', storage: 'heap', segment: 'heap', addr: '0x20001008', val: 'uninitialized' });
        break;
      case 2:
        debuggerActiveLine = 7; // if (buffer != NULL)
        writeGdbLog("Comparing pointer: 0x20001008 != NULL. Branch test passed.");
        break;
      case 3:
        debuggerActiveLine = 8; // buffer[0] = 'M'
        writeGdbLog("STRB 'M' -> Buffer address 0x20001008 updated.");
        updateHeapValue('Block1', 'M');
        updateSymbolVal('malloc block', '["M",0,0,0]');
        break;
      case 4:
        debuggerActiveLine = 9; // buffer[1] = 'C'
        writeGdbLog("STRB 'C' -> Buffer address 0x20001009 updated.");
        updateHeapValue('Block1', 'M, C');
        updateSymbolVal('malloc block', '["M","C",0,0]');
        break;
      case 5:
        debuggerActiveLine = 10; // buffer[2] = 'U'
        writeGdbLog("STRB 'U' -> Buffer address 0x2000100A updated.");
        updateHeapValue('Block1', 'M, C, U');
        updateSymbolVal('malloc block', '["M","C","U",0]');
        break;
      case 6:
        debuggerActiveLine = 11; // buffer[3] = '\0'
        writeGdbLog("STRB '\\0' -> Buffer address 0x2000100B updated.");
        updateHeapValue('Block1', 'M, C, U, \\0 ("MCU")');
        updateSymbolVal('malloc block', '"MCU"');
        break;
      case 7:
        debuggerActiveLine = 14; // free(buffer)
        writeGdbLog("BL free (0x20001008). Deallocating heap block memory slots.");
        removeHeapBlock('Block1');
        activeSymbols = activeSymbols.filter(s => s.name !== 'malloc block');
        break;
      case 8:
        debuggerActiveLine = 15; // buffer = NULL
        writeGdbLog("buffer reset to NULL.");
        updateRamBssValue('buffer', '0x00000000 (NULL)');
        updateSymbolVal('buffer', '0x00000000 (NULL)');
        break;
      case 9:
        debuggerActiveLine = 16; // return 0
        writeGdbLog("Popping main() frame.");
        popStackFrame();
        break;
      default:
        writeGdbLog("Program exited normally.");
        debuggerActiveLine = -1;
        document.getElementById('btn-debugger-step').disabled = true;
        programActive = false;
        showToast("End of instruction trace reached.", "warning");
        break;
    }
  }

  // Visual pointer update
  if (debuggerActiveLine >= 0) {
    const curr = document.getElementById(`code-line-${debuggerActiveLine}`);
    if (curr) {
      curr.classList.add('executing');
      curr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  updateSymbolTableHTML();
  simulationStepIndex++;
}

// ==========================================
// 5. HELPER DRAW FUNCTIONS FOR ADDR SPACE
// ==========================================

function addFlashText(name, addr, desc) {
  flashTextContainer.innerHTML += `
    <div style="font-size:0.65rem; border-bottom:1px dashed rgba(255,255,255,0.03); padding:4px 0; display:flex; justify-content:space-between;">
      <span style="color:#c084fc;">${name}</span>
      <span style="color:var(--text-dark);">${addr}</span>
    </div>
  `;
}

function addFlashRodata(name, addr, val) {
  flashRodataContainer.innerHTML += `
    <div style="font-size:0.65rem; border-bottom:1px dashed rgba(255,255,255,0.03); padding:4px 0; display:flex; justify-content:space-between;">
      <span style="color:#fbbf24;">${name}</span>
      <span style="color:var(--text-dark);">${addr}</span>
      <span style="color:var(--text-muted);">${val}</span>
    </div>
  `;
}

function addPreprocessorMacro(name, expansion) {
  preprocessorContainer.innerHTML += `
    <div style="display:flex; justify-content:space-between; border-bottom:1px dashed rgba(255,255,255,0.02); padding-bottom:3px;">
      <span style="color:var(--accent-rose);">#define ${name}</span>
      <span style="color:var(--accent-cyan); font-weight:bold;">${expansion}</span>
    </div>
  `;
}

function addRamDataBlock(name, addr, val, volatile = false) {
  ramDataContainer.innerHTML += `
    <div class="ram-byte-block data ${volatile ? 'volatile' : ''}" id="ram-data-${name}">
      <span class="ram-lbl-name" style="color:var(--mem-data)">${name} <span class="tag-class ${volatile ? 'volatile' : ''}" style="font-size:0.5rem; padding:1px 3px;">${volatile ? 'volatile' : '.data'}</span></span>
      <span class="ram-lbl-val">${val}</span>
      <span class="ram-lbl-addr">${addr}</span>
    </div>
  `;
}

function updateRamDataValue(name, val) {
  const el = document.getElementById(`ram-data-${name}`);
  if (el) {
    el.querySelector('.ram-lbl-val').textContent = val;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 800);
  }
}

function addRamBssBlock(name, addr, val) {
  ramBssContainer.innerHTML += `
    <div class="ram-byte-block bss" id="ram-bss-${name}">
      <span class="ram-lbl-name" style="color:var(--mem-bss)">${name} <span class="tag-class" style="font-size:0.5rem; padding:1px 3px;">.bss</span></span>
      <span class="ram-lbl-val">${val}</span>
      <span class="ram-lbl-addr">${addr}</span>
    </div>
  `;
}

function updateRamBssValue(name, val) {
  const el = document.getElementById(`ram-bss-${name}`);
  if (el) {
    el.querySelector('.ram-lbl-val').textContent = val;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 800);
  }
}

// Stack Manipulators
function pushStackFrame(name, addr, vars = []) {
  const frameId = `stack-frame-${name.replace(/[^a-zA-Z0-9]/g, '')}`;
  const frameDiv = document.createElement('div');
  frameDiv.className = 'ram-byte-block stack active';
  frameDiv.id = frameId;
  
  let varsHtml = '';
  vars.forEach(v => {
    varsHtml += `<div class="stack-var-row" id="var-${frameId}-${v.name}" style="display:flex; justify-content:space-between; width:100%; opacity:0.8; font-size:0.6rem;">
      <span style="color:#f43f5e;">&bull; ${v.name}:</span>
      <span class="var-val" style="color:var(--text-main); font-weight:bold;">${v.val}</span>
    </div>`;
  });

  frameDiv.innerHTML = `
    <div style="display:flex; flex-direction:column; width:100%; gap:4px;">
      <div style="display:flex; justify-content:space-between; width:100%; font-weight:bold;">
        <span style="color:var(--mem-stack)">[Frame] ${name}</span>
        <span style="color:var(--text-dark);">${addr}</span>
      </div>
      <div class="stack-vars-list" style="display:flex; flex-direction:column; width:100%; padding-left:10px;">
        ${varsHtml}
      </div>
    </div>
  `;
  
  // Insert at the top of stack region (Stack grows DOWN from high address)
  ramStackContainer.appendChild(frameDiv);
  setTimeout(() => frameDiv.classList.remove('active'), 1000);
  
  checkStackHeapCollision();
}

function addStackVariable(frameName, name, val) {
  const frameId = `stack-frame-${frameName.replace(/[^a-zA-Z0-9]/g, '')}`;
  const frame = document.getElementById(frameId);
  if (frame) {
    const list = frame.querySelector('.stack-vars-list');
    const varRow = document.createElement('div');
    varRow.className = 'stack-var-row';
    varRow.id = `var-${frameId}-${name}`;
    varRow.style.cssText = 'display:flex; justify-content:space-between; width:100%; opacity:0.8; font-size:0.6rem;';
    varRow.innerHTML = `
      <span style="color:#f43f5e;">&bull; ${name}:</span>
      <span class="var-val" style="color:var(--text-main); font-weight:bold;">${val}</span>
    `;
    list.appendChild(varRow);
    frame.classList.add('active');
    setTimeout(() => frame.classList.remove('active'), 500);
  }
}

function updateStackVariableVal(frameName, name, val) {
  const frameId = `stack-frame-${frameName.replace(/[^a-zA-Z0-9]/g, '')}`;
  const varRow = document.getElementById(`var-${frameId}-${name}`);
  if (varRow) {
    varRow.querySelector('.var-val').textContent = val;
    const frame = document.getElementById(frameId);
    if (frame) {
      frame.classList.add('active');
      setTimeout(() => frame.classList.remove('active'), 600);
    }
  }
}

function popStackFrame() {
  const frames = ramStackContainer.querySelectorAll('.ram-byte-block.stack');
  if (frames.length > 0) {
    const lastFrame = frames[frames.length - 1];
    lastFrame.style.transform = 'scale(0.9)';
    lastFrame.style.opacity = '0';
    setTimeout(() => {
      lastFrame.remove();
      checkStackHeapCollision();
    }, 200);
  }
}

// Heap Allocations
function addHeapBlock(id, addr, size, val) {
  const blockDiv = document.createElement('div');
  blockDiv.className = 'ram-byte-block heap active';
  blockDiv.id = `heap-block-${id}`;
  blockDiv.innerHTML = `
    <span class="ram-lbl-name" style="color:var(--mem-heap)">[Alloc] malloc(${size}) <span class="tag-class" style="font-size:0.5rem; background:rgba(99,102,241,0.15); color:var(--accent-indigo); padding:1px 3px;">heap</span></span>
    <span class="ram-lbl-val">${val}</span>
    <span class="ram-lbl-addr">${addr}</span>
  `;
  
  // Insert heap (Heap grows UP from low address)
  ramHeapContainer.appendChild(blockDiv);
  setTimeout(() => blockDiv.classList.remove('active'), 1000);
  
  checkStackHeapCollision();
}

function updateHeapValue(id, val) {
  const el = document.getElementById(`heap-block-${id}`);
  if (el) {
    el.querySelector('.ram-lbl-val').textContent = val;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 800);
  }
}

function removeHeapBlock(id) {
  const el = document.getElementById(`heap-block-${id}`);
  if (el) {
    el.style.transform = 'scale(0.9)';
    el.style.opacity = '0';
    setTimeout(() => {
      el.remove();
      checkStackHeapCollision();
    }, 200);
  }
}

// Detect memory collisions (Stack Overflow)
function checkStackHeapCollision() {
  const stackFramesCount = ramStackContainer.querySelectorAll('.ram-byte-block.stack').length;
  const heapBlocksCount = ramHeapContainer.querySelectorAll('.ram-byte-block.heap').length;
  
  const warning = document.getElementById('warning-stack-overflow');
  
  // Simulated collision: if stack frames + heap blocks > 5, display collision alert!
  if (stackFramesCount + heapBlocksCount >= 5) {
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

// CPU Register utilities
function updateCpuRegistersHud(regs) {
  for (const [r, val] of Object.entries(regs)) {
    const valEl = document.getElementById(`val-${r}`);
    if (valEl) {
      valEl.textContent = val.toString(16).toUpperCase().padStart(2, '0');
      cpuRegisters[r] = val;
    }
  }
}

function highlightCpuRegister(reg, active) {
  const box = document.getElementById(`reg-${reg}`);
  if (box) {
    box.classList.toggle('active', active);
  }
}

// ==========================================
// 6. SYMBOL TABLE MATRICES DISPLAY
// ==========================================
const symbolSearch = document.getElementById('symbol-search-input');

function updateSymbolTableHTML() {
  const filter = symbolSearch.value.trim().toLowerCase();
  symbolTableBody.innerHTML = '';

  const filtered = activeSymbols.filter(s => s.name.toLowerCase().includes(filter));

  if (filtered.length === 0) {
    symbolTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-dark);">No matching symbols found.</td></tr>';
    return;
  }

  filtered.forEach(s => {
    let tagClass = 'tag-class';
    if (s.storage === 'volatile') tagClass = 'tag-class volatile';
    if (s.storage === 'static') tagClass = 'tag-class static';
    if (s.storage === 'register') tagClass = 'tag-class register';

    symbolTableBody.innerHTML += `
      <tr>
        <td style="font-weight:bold; color:var(--text-main);">${s.name}</td>
        <td><span class="${tagClass}">${s.storage}</span></td>
        <td style="color:var(--text-muted);">${s.segment}</td>
        <td style="color:var(--text-dark);">${s.addr}</td>
        <td style="font-weight:bold; color:var(--accent-cyan);">${s.val}</td>
      </tr>
    `;
  });
}

symbolSearch.addEventListener('input', updateSymbolTableHTML);

function updateSymbolVal(name, val) {
  const sym = activeSymbols.find(s => s.name === name);
  if (sym) {
    sym.val = val;
  }
}

// ==========================================
// 7. GDB DEBUGGER CONSOLE UTILITIES
// ==========================================
const debuggerConsole = document.getElementById('debugger-console-log');

function writeGdbLog(text) {
  const lines = text.split('\n');
  
  lines.forEach(l => {
    const div = document.createElement('div');
    div.className = 'terminal-line';
    
    // Command prompt highlight
    if (l.startsWith('target') || l.startsWith('load') || l.startsWith('Breakpoint')) {
      div.style.color = '#38bdf8'; // light blue
    } else if (l.startsWith('Volatile') || l.startsWith('Scanned') || l.startsWith('⚠️')) {
      div.style.color = '#fbbf24'; // warning yellow
    } else if (l.startsWith('Unwinding') || l.startsWith('Exit') || l.startsWith('Popping')) {
      div.style.color = '#f472b6'; // pink
    } else {
      div.style.color = '#a7f3d0'; // standard emerald
    }
    
    div.textContent = (l.startsWith('target') ? '(gdb) ' : '') + l;
    debuggerConsole.appendChild(div);
  });
  
  debuggerConsole.scrollTop = debuggerConsole.scrollHeight;
}

// ==========================================
// 8. DYNAMIC AUDIO & MODALS
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
    osc.frequency.setValueAtTime(high ? 900 : 380, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.05);
  } catch (e) {
    // web audio API suspended
  }
}

document.querySelectorAll('.btn-modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    compilationModal.classList.remove('active');
    compileModalActive = false;
  });
});

// Dynamic Toast Notifications
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
  
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 50);
  
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Initial setup on window load
window.addEventListener('load', loadSelectedPreset);
