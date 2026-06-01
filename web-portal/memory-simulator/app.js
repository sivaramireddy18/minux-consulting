// MEM.OS v2.0 - Embedded Memory Allocation & Compiler Simulator - Core Application Script

// ==========================================
// 1. EDITABLE CODE EDITOR & SYNC SCROLL
// ==========================================
const textarea = document.getElementById('code-editor-textarea');
const lineNumbers = document.getElementById('editor-line-numbers');
const dropdownSnippet = document.getElementById('code-snippet-select');
const executionOverlay = document.getElementById('execution-pointer-overlay');
const executionArrow = document.getElementById('execution-arrow');

// Default starting code snippets
const SNIPPET_TEMPLATES = {
  globals_boot: `// Boot up code & Storage Classes scoping demo
#define LED_PIN      5
#define SYS_SPEED    16000000U

const char* header = "BOOT";  // Allocated in FLASH .rodata
static int cycles = 15;      // Allocated in RAM .data (static)
volatile int state = 1;      // Allocated in RAM .data (volatile)
static char error_log[4];    // Allocated in RAM .bss

int main(void) {
    register int local_cycles; // Bypasses RAM, uses CPU Register
    auto int temp = 0;         // Local auto variable in Stack
    
    local_cycles = cycles;     // Load value from RAM to Register
    temp = local_cycles + 10;  // Local arithmetic
    
    state = 0;                 // Volatile write directly to RAM
    return 0;
}`,

  stack_recursion: `// Recursive Deep Stack Frame Demo
int result = 0;                // Allocated in RAM .bss

int calc_factorial(int n) {
    auto int local_n = n;      // Pushes onto Stack frame
    if (local_n <= 1) {
        return 1;
    }
    return local_n * calc_factorial(local_n - 1);
}

int main(void) {
    result = calc_factorial(3); // Recursive stack branch
    return 0;
}`,

  heap_malloc: `// Dynamic SRAM Heap Allocation Demo
#define NULL   (void*)0
char* buffer = NULL;           // Global pointer in RAM .bss

int main(void) {
    // Allocate 4 bytes dynamically on SRAM Heap
    buffer = (char*)malloc(4);
    
    if (buffer != NULL) {
        buffer[0] = 'M';
        buffer[1] = 'C';
        buffer[2] = 'U';
        buffer[3] = '\\0';
    }
    
    free(buffer);              // Deallocate heap chunk
    buffer = NULL;
    return 0;
}`
};

function updateLineNumbers() {
  const lines = textarea.value.split('\n');
  const count = lines.length;
  let html = '';
  for (let i = 1; i <= count; i++) {
    html += `<div>${i}</div>`;
  }
  lineNumbers.innerHTML = html;
}

textarea.addEventListener('input', updateLineNumbers);
textarea.addEventListener('scroll', () => {
  lineNumbers.scrollTop = textarea.scrollTop;
  // Position debugger arrow overlay
  if (debuggerActiveLine >= 0) {
    positionExecutionArrow(debuggerActiveLine);
  }
});

function loadTemplateIntoEditor() {
  const selected = dropdownSnippet.value;
  if (SNIPPET_TEMPLATES[selected]) {
    textarea.value = SNIPPET_TEMPLATES[selected];
    updateLineNumbers();
    resetDebuggerState();
  }
}

dropdownSnippet.addEventListener('change', loadTemplateIntoEditor);

// ==========================================
// 2. DYNAMIC JS-BASED C COMPILER / PARSER
// ==========================================
let compiledPreset = {
  code: [],
  preprocessed: [],
  assembly: [],
  object: [],
  linker: "",
  binaryMap: "",
  steps: [] // list of step actions
};

let currentPresetKey = 'globals_boot';
let nextAddressFlash = 0x08000000;
let nextAddressRam = 0x20000000;

function compileUserCode() {
  const rawCode = textarea.value;
  const lines = rawCode.split('\n');
  
  compiledPreset.code = [...lines];
  compiledPreset.preprocessed = [];
  compiledPreset.assembly = [];
  compiledPreset.object = [];
  compiledPreset.steps = [];
  
  let macros = {};
  let globals = [];
  let locals = [];
  let functions = [];
  
  writeGdbLog("Compiler initiated: gcc -Wall -O0 target.c...");
  
  // ----------------------------------------
  // STAGE 1: LEXICAL PREPROCESSOR SWEEP
  // ----------------------------------------
  compiledPreset.preprocessed.push("// Preprocessed C Output (gcc -E)");
  compiledPreset.preprocessed.push("// Macros are expanded, comments stripped");
  compiledPreset.preprocessed.push("");

  lines.forEach((line) => {
    let cleanLine = line.replace(/\/\/.*$/, '').trim(); // strip comments
    
    // Macro scrape: #define KEY VALUE
    const macroMatch = cleanLine.match(/^#define\s+(\w+)\s+(.+)$/);
    if (macroMatch) {
      macros[macroMatch[1]] = macroMatch[2];
      return; // strip define lines from preprocessing output
    }
    
    if (cleanLine === '') return;
    
    // Replace macros in the preprocessed output
    let preprocessedLine = cleanLine;
    for (const [key, val] of Object.entries(macros)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      preprocessedLine = preprocessedLine.replace(regex, val);
    }
    compiledPreset.preprocessed.push(preprocessedLine);
  });

  // ----------------------------------------
  // STAGE 2: PARSE SYMBOLS & SEGMENTS
  // ----------------------------------------
  nextAddressFlash = 0x08000040;
  nextAddressRam = 0x20000000;

  // Track scopes to split Globals vs Locals
  let bracketDepth = 0;
  let currentFunction = "";
  
  lines.forEach((line, idx) => {
    let cleanLine = line.replace(/\/\/.*$/, '').trim();
    if (cleanLine === '') return;
    
    // Track brackets
    if (cleanLine.includes('{')) bracketDepth++;
    if (cleanLine.includes('}')) {
      bracketDepth--;
      if (bracketDepth === 0) currentFunction = "";
    }

    // Match Functions: int main(args) {
    const funcMatch = cleanLine.match(/^(\w+)\s+(\w+)\s*\([^\)]*\)\s*\{?/);
    if (funcMatch && bracketDepth <= 1 && !cleanLine.startsWith('static') && !cleanLine.startsWith('volatile') && !cleanLine.startsWith('const')) {
      const type = funcMatch[1];
      const name = funcMatch[2];
      if (name !== 'if' && name !== 'while' && name !== 'for') {
        currentFunction = name;
        functions.push({ name, addr: '0x' + nextAddressFlash.toString(16).toUpperCase() });
        nextAddressFlash += 48; // reserve bytes in flash
        return;
      }
    }

    // Match Variables declarations: int x = 15;
    // Regex matches storage classes static, volatile, const, extern, register, auto
    const varMatch = cleanLine.match(/^(?:(static|volatile|const|extern|register|auto)\s+)?(?:int|char\*|char)\s+(\w+)(?:\s*=\s*([^;]+))?;/);
    if (varMatch) {
      const storage = varMatch[1] || (bracketDepth === 0 ? 'global' : 'auto');
      const name = varMatch[2];
      const initVal = varMatch[3] ? varMatch[3].trim() : null;
      
      if (bracketDepth === 0) {
        // Global / Static Data allocation
        let addr = "";
        let segment = "";
        let size = 4;
        
        if (storage === 'const') {
          segment = ".rodata";
          addr = '0x' + nextAddressFlash.toString(16).toUpperCase();
          nextAddressFlash += 16;
        } else if (initVal !== null && initVal !== "NULL" && initVal !== "0") {
          segment = ".data";
          addr = '0x' + nextAddressRam.toString(16).toUpperCase();
          nextAddressRam += 4;
        } else {
          segment = ".bss";
          addr = '0x' + nextAddressRam.toString(16).toUpperCase();
          nextAddressRam += 4;
        }
        
        globals.push({ name, storage, segment, addr, initVal });
      } else {
        // Local declarations inside functions
        locals.push({ name, storage, function: currentFunction, initVal });
      }
    }
  });

  // ----------------------------------------
  // STAGE 3: INTERACTIVE ASSEMBLER & MACHINE BYTES
  // ----------------------------------------
  compiledPreset.assembly.push(".section .rodata");
  globals.filter(g => g.segment === '.rodata').forEach(g => {
    compiledPreset.assembly.push(`${g.name}:   .word 0x${nextAddressFlash.toString(16)} @ constant pointer`);
  });
  
  compiledPreset.assembly.push("");
  compiledPreset.assembly.push(".section .data");
  globals.filter(g => g.segment === '.data').forEach(g => {
    compiledPreset.assembly.push(`${g.name}:   .word ${g.initVal} @ Storage class: ${g.storage}`);
  });

  compiledPreset.assembly.push("");
  compiledPreset.assembly.push(".section .bss");
  globals.filter(g => g.segment === '.bss').forEach(g => {
    compiledPreset.assembly.push(`${g.name}:   .space 4`);
  });

  compiledPreset.assembly.push("");
  compiledPreset.assembly.push(".section .text");
  
  functions.forEach(f => {
    compiledPreset.assembly.push(`.global ${f.name}`);
    compiledPreset.assembly.push(`${f.name}:`);
    compiledPreset.assembly.push(`    PUSH {r4, lr}        @ Reserve stack frame`);
    
    // Translate some C lines inside this function to assembly
    let lineIdx = 0;
    lines.forEach((line) => {
      let cleanLine = line.replace(/\/\/.*$/, '').trim();
      if (cleanLine === '') return;
      
      // Simple assignment variable check: x = cycles; or x = local_cycles + 10;
      const assignMatch = cleanLine.match(/^(\w+)\s*=\s*([^;]+);/);
      if (assignMatch) {
        const target = assignMatch[1];
        const expr = assignMatch[2].trim();
        
        if (expr.includes('+')) {
          const parts = expr.split('+');
          compiledPreset.assembly.push(`    ADD r0, r1, #${parts[1].trim()} @ compute arithmetic`);
        } else if (expr.startsWith('malloc')) {
          compiledPreset.assembly.push(`    BL malloc            @ allocate heap chunk`);
        } else {
          compiledPreset.assembly.push(`    LDR r0, =${expr}     @ load variable from RAM`);
          compiledPreset.assembly.push(`    STR r0, [${target}]  @ write result`);
        }
      }
    });
    
    compiledPreset.assembly.push(`    POP {r4, pc}         @ pop stack frame`);
  });

  // Object machine codes (Dummy object hex representation mapped from assembly)
  compiledPreset.assembly.forEach((asm, idx) => {
    if (asm.trim().startsWith('.') || asm.trim().endsWith(':') || asm.trim() === '') return;
    const dummyOpcode = (0xe92d4000 + idx * 4).toString(16);
    compiledPreset.object.push(`   ${(idx * 4).toString(16)}: ${dummyOpcode}   ${asm}`);
  });

  // Linker script
  compiledPreset.linker = `/* Linker Script Map (linker.ld) */\nMEMORY {\n  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 256K\n  SRAM (rwx) : ORIGIN = 0x20000000, LENGTH = 32K\n}\n\nSECTIONS {\n  .text :   { *(.text) } > FLASH\n  .rodata : { *(.rodata) } > FLASH\n  .data :   { *(.data) } > SRAM AT> FLASH\n  .bss :    { *(.bss) } > SRAM\n}`;

  // Binary map allocations
  let binMapStr = `/* Segment absolute mappings in MCU Flash/RAM */\n\n[FLASH AT 0x08000000]\n`;
  functions.forEach(f => {
    binMapStr += `${f.addr} - 0x0800003F : .text (${f.name})\n`;
  });
  globals.filter(g => g.segment === '.rodata').forEach(g => {
    binMapStr += `${g.addr} - 0x0800004F : .rodata (${g.name})\n`;
  });

  binMapStr += `\n[RAM AT 0x20000000]\n`;
  globals.filter(g => g.segment === '.data' || g.segment === '.bss').forEach(g => {
    binMapStr += `${g.addr} - 0x2000000C : ${g.segment} (${g.name})\n`;
  });
  compiledPreset.binaryMap = binMapStr;

  // ----------------------------------------
  // STAGE 4: COMPILE RUNTIME INTERPRETER ACTIONS
  // ----------------------------------------
  // Scan lines and construct dynamic debug actions!
  let currentFuncScope = "";
  let tempVarCount = 0;
  
  lines.forEach((line, idx) => {
    let cleanLine = line.replace(/\/\/.*$/, '').trim();
    if (cleanLine === '') return;
    
    // Function entry tracking
    const funcMatch = cleanLine.match(/^(\w+)\s+(\w+)\s*\([^\)]*\)\s*\{?/);
    if (funcMatch && !cleanLine.startsWith('static') && !cleanLine.startsWith('volatile') && !cleanLine.startsWith('const')) {
      const fName = funcMatch[2];
      if (fName !== 'if' && fName !== 'while' && fName !== 'for') {
        currentFuncScope = fName;
        compiledPreset.steps.push({
          lineIndex: idx,
          action: () => {
            writeGdbLog(`\nBreakpoint: Entering function ${fName}() scope.`);
            pushStackFrame(`${fName}()`, '0x20007FF0', []);
          }
        });
        return;
      }
    }

    // Closing brackets pops the frame
    if (cleanLine === '}' && currentFuncScope !== "") {
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          writeGdbLog(`Exiting function ${currentFuncScope}() body. Popping stack frame.`);
          popStackFrame();
          // Clear locals inside symbol table
          activeSymbols = activeSymbols.filter(s => s.segment !== 'stack');
          highlightCpuRegister('r1', false);
          currentFuncScope = "";
        }
      });
      return;
    }

    // Register declarations
    const registerMatch = cleanLine.match(/register\s+int\s+(\w+);/);
    if (registerMatch) {
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          writeGdbLog(`CPU Register suggestion 'register' detected: Binding symbol ${registerMatch[1]} to CPU Register R1.`);
          highlightCpuRegister('r1', true);
        }
      });
      return;
    }

    // Auto local variables stack allocations
    const autoMatch = cleanLine.match(/auto\s+int\s+(\w+)(?:\s*=\s*([^;]+))?;/);
    if (autoMatch) {
      const vName = autoMatch[1];
      const val = autoMatch[2] ? autoMatch[2].trim() : '0';
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          writeGdbLog(`Stack variable 'auto' initialized: Pushing local variable ${vName} onto SRAM stack.`);
          addStackVariable(`${currentFuncScope}()`, vName, val);
          activeSymbols.push({ name: vName, storage: 'auto', segment: 'stack', addr: '0x20007FE8', val });
        }
      });
      return;
    }

    // Malloc allocations
    const mallocMatch = cleanLine.match(/(\w+)\s*=\s*(?:\([^\)]+\))?malloc\((\d+)\);/);
    if (mallocMatch) {
      const pName = mallocMatch[1];
      const size = parseInt(mallocMatch[2]);
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          writeGdbLog(`Dynamic Heap allocation: malloc(${size} bytes) executed. Reserving SRAM low address memory block.`);
          addHeapBlock('Block1', '0x20001008', `${size} bytes`, 'uninitialized');
          updateRamBssValue(pName, '0x20001008 (Heap Pointer)');
          updateSymbolVal(pName, '0x20001008 (Heap Pointer)');
          activeSymbols.push({ name: 'Heap Block', storage: 'heap', segment: 'heap', addr: '0x20001008', val: 'uninitialized' });
        }
      });
      return;
    }

    // Free allocations
    const freeMatch = cleanLine.match(/free\((\w+)\);/);
    if (freeMatch) {
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          writeGdbLog(`Dynamic Heap free: Releasing allocated memory chunk.`);
          removeHeapBlock('Block1');
          activeSymbols = activeSymbols.filter(s => s.storage !== 'heap');
        }
      });
      return;
    }

    // Dynamic array index sets
    const arrayMatch = cleanLine.match(/(\w+)\[(\d+)\]\s*=\s*([^;]+);/);
    if (arrayMatch) {
      const pName = arrayMatch[1];
      const charVal = arrayMatch[3].replace(/['"]/g, '');
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          writeGdbLog(`Writing data value: STRB byte '${charVal}' into buffer index.`);
          updateHeapValue('Block1', charVal);
          updateSymbolVal('Heap Block', `"${charVal}"`);
        }
      });
      return;
    }

    // Dynamic assignments: local_cycles = cycles;
    const assignMatch = cleanLine.match(/^(\w+)\s*=\s*([^;]+);/);
    if (assignMatch && !cleanLine.includes('malloc') && !cleanLine.includes('[')) {
      const target = assignMatch[1];
      const expr = assignMatch[2].trim();
      
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          if (target === 'local_cycles') {
            writeGdbLog(`LDR r1, [cycles] -> CPU Register R1 loaded value 15.`);
            updateCpuRegistersHud({ r1: 15 });
          } else if (target === 'temp') {
            writeGdbLog(`ADD r0, r1, #10 -> temp local Stack variable updated to 25.`);
            updateStackVariableVal(`${currentFuncScope}()`, 'temp', '25');
            updateSymbolVal('temp', '25');
          } else if (target === 'state') {
            writeGdbLog(`Volatile RAM write bypass registers cache. Direct STR write state = 0.`);
            updateRamDataValue('state', '0');
            updateSymbolVal('state', '0');
          } else if (target === 'buffer' && expr === 'NULL') {
            writeGdbLog(`buffer pointer cleared to NULL.`);
            updateRamBssValue('buffer', '0x00000000 (NULL)');
            updateSymbolVal('buffer', '0x00000000 (NULL)');
          } else if (target === 'result') {
            writeGdbLog(`calc_factorial(3) complete. Global result set to 6 (Hex 0x06).`);
            updateRamBssValue('result', '6');
            updateSymbolVal('result', '6');
          }
        }
      });
      return;
    }

    // Recursive call stack presets simulation
    const recursiveMatch = cleanLine.match(/calc_factorial\((\w+)\s*-\s*1\)/);
    if (recursiveMatch && currentPresetKey === 'stack_recursion') {
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          tempVarCount++;
          writeGdbLog(`BL calc_factorial() -> Pushing recursive Stack Frame [depth: ${tempVarCount}]`);
          const nVal = 4 - tempVarCount;
          pushStackFrame(`factorial(n=${nVal})`, '0x20007FD0', [{ name: 'local_n', val: nVal }]);
          activeSymbols.push({ name: `n (depth ${tempVarCount})`, storage: 'auto', segment: 'stack', addr: '0x20007FC0', val: nVal });
          
          if (nVal <= 1) {
            writeGdbLog("Base Case Hit! n <= 1 is true. Unwinding Stack frame recursion.");
            // Pop stack frames in sequence
            setTimeout(() => {
              popStackFrame();
              popStackFrame();
              popStackFrame();
              updateCpuRegistersHud({ r0: 6 });
              activeSymbols = activeSymbols.filter(s => s.segment !== 'stack');
            }, 800);
          }
        }
      });
      return;
    }
  });

  // Cache compiled globals to load
  compiledPreset.globals = globals;
  compiledPreset.macros = macros;
  compiledPreset.functions = functions;

  CODE_PRESETS[currentPresetKey] = compiledPreset;
}

// Position execution 👉 overlay indicator
function positionExecutionArrow(lineIdx) {
  const editorRect = textarea.getBoundingClientRect();
  
  // Calculate vertical coordinate spacing based on line heights
  const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight);
  const paddingTop = parseFloat(window.getComputedStyle(textarea).paddingTop);
  
  const arrowY = paddingTop + (lineIdx * lineHeight) - textarea.scrollTop;
  
  if (arrowY >= 0 && arrowY < textarea.clientHeight) {
    executionOverlay.style.display = 'block';
    executionOverlay.style.top = `${arrowY}px`;
  } else {
    executionOverlay.style.display = 'none';
  }
}

// ==========================================
// 3. EDITABLE PLAYBACK SYSTEM & STEP DEBUGGER
// ==========================================
let debuggerActiveLine = -1;
let simulationStepIndex = 0;
let programActive = false;

// CPU register objects
const cpuRegisters = { r0: 0, r1: 0, r2: 0, r3: 0 };
let activeSymbols = [];

function resetDebuggerState() {
  debuggerActiveLine = -1;
  simulationStepIndex = 0;
  programActive = false;
  
  textarea.readOnly = false;
  textarea.style.opacity = '1';
  executionOverlay.style.display = 'none';

  document.getElementById('btn-debugger-step').disabled = true;
  document.getElementById('btn-debugger-reset').disabled = true;

  resetMemorySimHTML();
  writeGdbLog("Workspace loaded. Modify C code or click 'Build / Compile' to compile into memory!");
}

function triggerCompilationPipeline() {
  playClickSound(true);
  
  // Scrape and parse C editor contents dynamically!
  compileUserCode();
  
  currentCompileStage = 1;
  compileModalActive = true;
  compilationModal.classList.add('active');
  updateCompileStageView();
}

function initializeProgramSimulation() {
  resetMemorySimHTML();
  debuggerActiveLine = -1;
  simulationStepIndex = 0;
  programActive = true;
  activeSymbols = [];

  textarea.readOnly = true;
  textarea.style.opacity = '0.75';

  const compiled = CODE_PRESETS[currentPresetKey];

  // 1. Populate Preprocessor Macros
  for (const [key, val] of Object.entries(compiled.macros)) {
    addPreprocessorMacro(key, val);
  }

  // 2. Populate FLASH instructions
  compiled.functions.forEach(f => {
    addFlashText(f.name, f.addr, 'CPU Instructions');
  });

  // 3. Populate FLASH constants
  compiled.globals.filter(g => g.segment === '.rodata').forEach(g => {
    addFlashRodata(g.name, g.addr, g.initVal);
    activeSymbols.push({ name: g.name, storage: 'const', segment: '.rodata', addr: g.addr, val: g.initVal });
  });

  // 4. Populate SRAM globals (.data & .bss)
  compiled.globals.filter(g => g.segment === '.data').forEach(g => {
    const isVolatile = g.storage === 'volatile';
    addRamDataBlock(g.name, g.addr, g.initVal, isVolatile);
    activeSymbols.push({ name: g.name, storage: g.storage, segment: g.segment, addr: g.addr, val: g.initVal });
  });

  compiled.globals.filter(g => g.segment === '.bss').forEach(g => {
    addRamBssBlock(g.name, g.addr, '0x00000000');
    activeSymbols.push({ name: g.name, storage: g.storage, segment: g.segment, addr: g.addr, val: '0' });
  });

  updateSymbolTableHTML();
  writeGdbLog("target remote localhost:3333\nRemote connection established.\nObject loading... SUCCESS\nLinker mapping complete. Entry point PC set to main().");
}

function executeNextDebuggerStep() {
  const compiled = CODE_PRESETS[currentPresetKey];
  const steps = compiled.steps;

  if (simulationStepIndex >= steps.length) {
    writeGdbLog("Program exited normally. Debugger halted.");
    debuggerActiveLine = -1;
    executionOverlay.style.display = 'none';
    document.getElementById('btn-debugger-step').disabled = true;
    programActive = false;
    showToast("End of instruction trace reached.", "warning");
    return;
  }

  const step = steps[simulationStepIndex];
  debuggerActiveLine = step.lineIndex;
  
  // Position debugger 👉 execution overlay
  positionExecutionArrow(debuggerActiveLine);

  // Execute C instruction action
  step.action();

  updateSymbolTableHTML();
  simulationStepIndex++;
}

document.getElementById('btn-debugger-step').addEventListener('click', () => {
  if (!programActive) return;
  playClickSound(true);
  executeNextDebuggerStep();
});

document.getElementById('btn-debugger-reset').addEventListener('click', () => {
  playClickSound(false);
  resetDebuggerState();
  showToast("Debugger state reset.", "warning");
});

// Load snippet template on startup
window.addEventListener('load', () => {
  loadTemplateIntoEditor();
});
