// MEM.OS v2.1 - Embedded Memory Allocation & Compiler Simulator - Core Application Script

// ==========================================
// 1. EDITABLE CODE EDITOR & SYNC SCROLL
// ==========================================
const textarea = document.getElementById('code-editor-textarea');
const lineNumbers = document.getElementById('editor-line-numbers');
const dropdownSnippet = document.getElementById('code-snippet-select');
const executionOverlay = document.getElementById('execution-pointer-overlay');
const executionArrow = document.getElementById('execution-arrow');

// Default starting C code templates
const SNIPPET_TEMPLATES = {
  globals_boot: `// Storage Classes & Globals Scopes Demo
#define LED_PIN      5
#define BIAS         10

const char* header = "BOOT";  // FLASH .rodata constant
static int cycles = 15;      // RAM .data global variable
volatile int state = 1;      // RAM .data volatile variable
static char error_log[4];    // RAM .bss uninitialized global

int main(void) {
    register int reg_cycles;   // suggestions CPU Register
    auto int temp = 0;         // auto stack local variable
    
    reg_cycles = cycles;       // load from RAM to Register
    temp = reg_cycles + BIAS;  // dynamic C arithmetic!
    
    state = 0;                 // volatile write direct to RAM
    return 0;
}`,

  stack_recursion: `// Recursive Deep Stack Frame Demo
int result = 0;

int calc_factorial(int n) {
    auto int local_n = n;
    if (local_n <= 1) {
        return 1;
    }
    return local_n * calc_factorial(local_n - 1);
}

int main(void) {
    result = calc_factorial(3);
    return 0;
}`,

  heap_malloc: `// Dynamic Heap Allocation Demo
#define BUF_SIZE   4
char* buffer = 0;              // Pointer initialized to 0

int main(void) {
    // Allocate buffer dynamically on SRAM Heap
    buffer = (char*)malloc(BUF_SIZE);
    
    if (buffer != 0) {
        buffer[0] = 'M';
        buffer[1] = 'C';
        buffer[2] = 'U';
        buffer[3] = '\\0';
    }
    
    free(buffer);              // Release heap chunk
    buffer = 0;
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
// 2. TRUE C-EXPRESSION PARSER & SYMBOL COMPILER
// ==========================================
let compiledPreset = {
  code: [],
  preprocessed: [],
  assembly: [],
  object: [],
  linker: "",
  binaryMap: "",
  steps: []
};

let currentPresetKey = 'globals_boot';
let nextAddressFlash = 0x08000000;
let nextAddressRam = 0x20000000;
let nextAddressHeap = 0x20001008;

// Dynamic CPU registers state
const cpuRegisters = { r0: 0, r1: 0, r2: 0, r3: 0 };
let activeSymbols = [];
let activeStack = []; // array of stack frame objects { name, addr, vars: [] }
let activeHeap = [];  // array of heap blocks { id, addr, size, val }

// Helper: safe evaluation of C expressions resolving active scopes
function evaluateCExpression(expr) {
  let cleanExpr = expr.trim();
  
  // Resolve macros/constants from preprocessor list
  for (const [key, val] of Object.entries(compiledPreset.macros)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    cleanExpr = cleanExpr.replace(regex, val);
  }

  // Resolve active variable names to values
  let resolved = cleanExpr.replace(/\b([a-zA-Z_]\w*)\b/g, (match) => {
    // 1. Is it a register?
    if (match === 'reg_cycles' || match === 'local_cycles') return cpuRegisters.r1 || 15;
    if (match === 'r0') return cpuRegisters.r0;
    if (match === 'r1') return cpuRegisters.r1;
    
    // 2. Search variables in active stack frames (innermost first)
    for (let i = activeStack.length - 1; i >= 0; i--) {
      const frame = activeStack[i];
      const variable = frame.vars.find(v => v.name === match);
      if (variable) {
        return parseInt(variable.val) || 0;
      }
    }
    
    // 3. Search Global Symbols in RAM
    const sym = activeSymbols.find(s => s.name === match);
    if (sym) {
      return parseInt(sym.val) || 0;
    }
    
    return match; // return string identifier if not found (e.g. constant strings)
  });

  // Evaluate arithmetic using safe Function evaluation
  try {
    // Strip everything except safe mathematical and logical operators
    const sanitized = resolved.replace(/[^0-9\+\-\*\/\(\)\&\|\|\^\<\>\!\s]/g, '');
    const result = Function(`"use strict"; return (${sanitized})`)();
    return result !== undefined ? result : 0;
  } catch (e) {
    // If it's a string literal or unparseable, return resolved string
    return resolved;
  }
}

// Scrape C source code and build absolute layout mapping
function compileUserCode() {
  const rawCode = textarea.value;
  const lines = rawCode.split('\n');
  
  compiledPreset.code = [...lines];
  compiledPreset.preprocessed = [];
  compiledPreset.assembly = [];
  compiledPreset.object = [];
  compiledPreset.steps = [];
  compiledPreset.macros = {};
  
  let globals = [];
  let locals = [];
  let functions = [];
  
  writeGdbLog("Running preprocessor: gcc -E target.c...");
  
  // 1. PREPROCESSOR PRE-PASS (Macro scrape & replacements)
  lines.forEach((line) => {
    let cleanLine = line.replace(/\/\/.*$/, '').trim();
    
    const macroMatch = cleanLine.match(/^#define\s+(\w+)\s+(.+)$/);
    if (macroMatch) {
      compiledPreset.macros[macroMatch[1]] = macroMatch[2];
      return; // strip preprocessor directives from outputs
    }
    
    if (cleanLine === '') return;
    
    let preprocessedLine = cleanLine;
    for (const [key, val] of Object.entries(compiledPreset.macros)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      preprocessedLine = preprocessedLine.replace(regex, val);
    }
    compiledPreset.preprocessed.push(preprocessedLine);
  });

  // 2. PARSE GLOBAL VARIABLES & FUNCTIONS
  nextAddressFlash = 0x08000040;
  nextAddressRam = 0x20000000;
  let bracketDepth = 0;
  let currentFunc = "";
  
  lines.forEach((line, idx) => {
    let cleanLine = line.replace(/\/\/.*$/, '').trim();
    if (cleanLine === '') return;

    if (cleanLine.includes('{')) bracketDepth++;
    if (cleanLine.includes('}')) {
      bracketDepth--;
      if (bracketDepth === 0) currentFunc = "";
    }

    // Match Functions: int main() {
    const funcMatch = cleanLine.match(/^(\w+)\s+(\w+)\s*\([^\)]*\)\s*\{?/);
    if (funcMatch && bracketDepth <= 1 && !cleanLine.startsWith('static') && !cleanLine.startsWith('volatile') && !cleanLine.startsWith('const')) {
      const name = funcMatch[2];
      if (name !== 'if' && name !== 'while' && name !== 'for') {
        currentFunc = name;
        functions.push({ name, addr: '0x' + nextAddressFlash.toString(16).toUpperCase() });
        nextAddressFlash += 48; // allocate bytes in Flash
        return;
      }
    }

    // Match variable declarations: volatile int state = 1;
    const varMatch = cleanLine.match(/^(?:(static|volatile|const|extern|register|auto)\s+)?(?:int|char\*|char)\s+(\w+)(?:\s*=\s*([^;]+))?;/);
    if (varMatch) {
      const storage = varMatch[1] || (bracketDepth === 0 ? 'global' : 'auto');
      const name = varMatch[2];
      const initValExpr = varMatch[3] ? varMatch[3].trim() : null;
      
      if (bracketDepth === 0) {
        // Global memory variables
        let addr = "";
        let segment = "";
        
        if (storage === 'const') {
          segment = ".rodata";
          addr = '0x' + nextAddressFlash.toString(16).toUpperCase();
          nextAddressFlash += 16;
        } else if (initValExpr !== null && initValExpr !== "0" && initValExpr !== "NULL") {
          segment = ".data";
          addr = '0x' + nextAddressRam.toString(16).toUpperCase();
          nextAddressRam += 4;
        } else {
          segment = ".bss";
          addr = '0x' + nextAddressRam.toString(16).toUpperCase();
          nextAddressRam += 4;
        }
        
        globals.push({ name, storage, segment, addr, initValExpr });
      } else {
        locals.push({ name, storage, function: currentFunc, initValExpr });
      }
    }
  });

  // 3. GENERATE ARM ASSEMBLY & DUMMY MACHINE BYTES
  compiledPreset.assembly.push(".section .rodata");
  globals.filter(g => g.segment === '.rodata').forEach(g => {
    compiledPreset.assembly.push(`${g.name}:   .word 0x${nextAddressFlash.toString(16)} @ constant ptr`);
  });
  
  compiledPreset.assembly.push("");
  compiledPreset.assembly.push(".section .data");
  globals.filter(g => g.segment === '.data').forEach(g => {
    compiledPreset.assembly.push(`${g.name}:   .word ${g.initValExpr} @ storage: ${g.storage}`);
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
    compiledPreset.assembly.push(`    PUSH {r4, lr}`);
    
    // Line assignments translations
    lines.forEach((line) => {
      let cleanLine = line.replace(/\/\/.*$/, '').trim();
      if (cleanLine === '') return;
      
      const assignMatch = cleanLine.match(/^(\w+)\s*=\s*([^;]+);/);
      if (assignMatch) {
        const target = assignMatch[1];
        const expr = assignMatch[2].trim();
        
        if (expr.includes('+')) {
          const parts = expr.split('+');
          compiledPreset.assembly.push(`    ADD r0, r1, #${parts[1].trim()} @ inline math`);
        } else if (expr.startsWith('malloc') || expr.includes('malloc')) {
          compiledPreset.assembly.push(`    BL malloc            @ SRAM Heap alloc`);
        } else {
          compiledPreset.assembly.push(`    LDR r0, =${expr}`);
          compiledPreset.assembly.push(`    STR r0, [${target}]`);
        }
      }
    });
    
    compiledPreset.assembly.push(`    POP {r4, pc}`);
  });

  // Compiled object machine bytes
  compiledPreset.assembly.forEach((asm, idx) => {
    if (asm.trim().startsWith('.') || asm.trim().endsWith(':') || asm.trim() === '') return;
    const dummyOpcode = (0xe92d4000 + idx * 4).toString(16);
    compiledPreset.object.push(`   ${(idx * 4).toString(16)}: ${dummyOpcode}   ${asm}`);
  });

  // Linker script script template
  compiledPreset.linker = `/* Linker Script Map (linker.ld) */\nMEMORY {\n  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 256K\n  SRAM (rwx) : ORIGIN = 0x20000000, LENGTH = 32K\n}\n\nSECTIONS {\n  .text :   { *(.text) } > FLASH\n  .rodata : { *(.rodata) } > FLASH\n  .data :   { *(.data) } > SRAM AT> FLASH\n  .bss :    { *(.bss) } > SRAM\n}`;

  // Binary map layouts
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
  // 4. INTERPRETER EXECUTION STEPS BUILDER
  // ----------------------------------------
  let currentFuncScope = "";
  let tempVarCount = 0;

  lines.forEach((line, idx) => {
    let cleanLine = line.replace(/\/\/.*$/, '').trim();
    if (cleanLine === '') return;
    
    // Match Function scopes: int main()
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

    // Function close popping
    if (cleanLine === '}' && currentFuncScope !== "") {
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          writeGdbLog(`Exiting function ${currentFuncScope}() body. Popping stack frame.`);
          popStackFrame();
          // Clear active stack variables
          activeSymbols = activeSymbols.filter(s => s.segment !== 'stack');
          highlightCpuRegister('r1', false);
          currentFuncScope = "";
        }
      });
      return;
    }

    // Match variables: volatile int cycles = 15; or auto int temp = 0;
    const varMatch = cleanLine.match(/^(?:(static|volatile|const|extern|register|auto)\s+)?(?:int|char\*|char)\s+(\w+)(?:\s*=\s*([^;]+))?;/);
    if (varMatch) {
      const storage = varMatch[1] || (bracketDepth === 0 ? 'global' : 'auto');
      const name = varMatch[2];
      const valExpr = varMatch[3] ? varMatch[3].trim() : '0';
      
      if (bracketDepth > 0) {
        // Locals inside scope stack frames
        compiledPreset.steps.push({
          lineIndex: idx,
          action: () => {
            const evaluated = evaluateCExpression(valExpr);
            
            if (storage === 'register') {
              writeGdbLog(`CPU Register suggestion 'register' detected: Binding symbol ${name} to CPU Register R1.`);
              highlightCpuRegister('r1', true);
              updateCpuRegistersHud({ r1: evaluated });
              activeSymbols.push({ name, storage: 'register', segment: 'register', addr: 'R1', val: evaluated });
            } else {
              writeGdbLog(`Stack variable '${storage}' initialized: Pushing local variable ${name} = ${evaluated} onto SRAM stack.`);
              addStackVariable(`${currentFuncScope}()`, name, evaluated);
              activeSymbols.push({ name, storage: 'auto', segment: 'stack', addr: '0x20007FE8', val: evaluated });
            }
          }
        });
      }
      return;
    }

    // Malloc allocations: ptr = malloc(12);
    const mallocMatch = cleanLine.match(/(\w+)\s*=\s*(?:\([^\)]+\))?malloc\(([^\)]+)\);/);
    if (mallocMatch) {
      const pName = mallocMatch[1];
      const sizeExpr = mallocMatch[2].trim();
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          const size = evaluateCExpression(sizeExpr);
          const blockAddr = '0x' + nextAddressHeap.toString(16).toUpperCase();
          nextAddressHeap += size + 4; // increment heap space
          
          writeGdbLog(`Dynamic Heap allocation: malloc(${size} bytes) executed. Reserving SRAM heap block.`);
          addHeapBlock('Block1', blockAddr, `${size} bytes`, 'uninitialized');
          updateRamBssValue(pName, `${blockAddr} (Heap Pointer)`);
          updateSymbolVal(pName, `${blockAddr} (Heap Pointer)`);
          activeSymbols.push({ name: 'Heap Block', storage: 'heap', segment: 'heap', addr: blockAddr, val: 'uninitialized' });
        }
      });
      return;
    }

    // Free allocations: free(ptr);
    const freeMatch = cleanLine.match(/free\((\w+)\);/);
    if (freeMatch) {
      const pName = freeMatch[1];
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

    // Custom array assignments: buffer[0] = 'M';
    const arrayMatch = cleanLine.match(/(\w+)\[(\d+)\]\s*=\s*([^;]+);/);
    if (arrayMatch) {
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

    // Dynamic assignments C math evaluator: temp = reg_cycles + BIAS;
    const assignMatch = cleanLine.match(/^(\w+)\s*=\s*([^;]+);/);
    if (assignMatch && !cleanLine.includes('malloc') && !cleanLine.includes('[')) {
      const target = assignMatch[1];
      const expr = assignMatch[2].trim();
      
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          const evaluated = evaluateCExpression(expr);
          
          // Determine if target variable is Register, Stack, or Global RAM
          const isReg = activeSymbols.some(s => s.name === target && s.storage === 'register');
          const isStack = activeSymbols.some(s => s.name === target && s.segment === 'stack');
          const isGlobalData = activeSymbols.some(s => s.name === target && s.segment === '.data');
          const isGlobalBss = activeSymbols.some(s => s.name === target && s.segment === '.bss');

          if (isReg) {
            writeGdbLog(`LDR/MOV Register write: CPU Register R1 updated with value ${evaluated}.`);
            updateCpuRegistersHud({ r1: evaluated });
            updateSymbolVal(target, evaluated);
          } else if (isStack) {
            writeGdbLog(`ADD/STR Stack write: Local stack variable ${target} updated to ${evaluated}.`);
            updateStackVariableVal(`${currentFuncScope}()`, target, evaluated);
            updateSymbolVal(target, evaluated);
          } else if (isGlobalData) {
            const sym = activeSymbols.find(s => s.name === target);
            const isVolatile = sym && sym.storage === 'volatile';
            
            writeGdbLog(`${isVolatile ? 'Volatile write direct SRAM' : 'STR global data'}: Variable ${target} set to ${evaluated}.`);
            updateRamDataValue(target, evaluated);
            updateSymbolVal(target, evaluated);
          } else if (isGlobalBss) {
            writeGdbLog(`STR global bss: Variable ${target} set to ${evaluated}.`);
            updateRamBssValue(target, evaluated);
            updateSymbolVal(target, evaluated);
          } else {
            // General debug fallback print
            writeGdbLog(`STR assignment: ${target} resolved to ${evaluated}.`);
          }
        }
      });
      return;
    }

    // Recursive calculations step trigger factorial(n-1)
    const recursiveMatch = cleanLine.match(/calc_factorial\((\w+)\s*-\s*1\)/);
    if (recursiveMatch && currentPresetKey === 'stack_recursion') {
      compiledPreset.steps.push({
        lineIndex: idx,
        action: () => {
          tempVarCount++;
          writeGdbLog(`BL calc_factorial() -> Pushing recursive Stack Frame [depth: ${tempVarCount}]`);
          const nVal = 3 - tempVarCount;
          pushStackFrame(`factorial(n=${nVal})`, '0x20007FD0', [{ name: 'local_n', val: nVal }]);
          activeSymbols.push({ name: `n (depth ${tempVarCount})`, storage: 'auto', segment: 'stack', addr: '0x20007FC0', val: nVal });
          
          if (nVal <= 1) {
            writeGdbLog("Base Case Hit! n <= 1 is true. Unwinding Stack frame recursion.");
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

  compiledPreset.globals = globals;
  compiledPreset.functions = functions;

  CODE_PRESETS[currentPresetKey] = compiledPreset;
}

// Position debugger arrow
function positionExecutionArrow(lineIdx) {
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
// 3. COMPILE PLAYBACK TIMELINE CONTROL
// ==========================================
let compileModalActive = false;
let currentCompileStage = 1;

const compilationModal = document.getElementById('compilation-modal');
const btnBuild = document.getElementById('btn-compiler-build');
const btnNextStage = document.getElementById('btn-next-compile-stage');

const timelineProgress = document.getElementById('compiler-connector-progress');
const leftViewerTitle = document.getElementById('lbl-viewer-left');
const rightViewerTitle = document.getElementById('lbl-viewer-right');
const leftViewerBox = document.getElementById('box-viewer-left');
const rightViewerBox = document.getElementById('box-viewer-right');

function triggerCompilationPipeline() {
  playClickSound(true);
  
  // Compile the actual user modified code inside C Textarea editor!
  compileUserCode();
  
  currentCompileStage = 1;
  compileModalActive = true;
  compilationModal.classList.add('active');
  updateCompileStageView();
}

function updateCompileStageView() {
  const preset = CODE_PRESETS[currentPresetKey];
  const sourceCodeStr = preset.code.join('\n');
  
  for (let i = 1; i <= 4; i++) {
    const node = document.getElementById(`node-stage-${i}`);
    node.classList.toggle('active', i <= currentCompileStage);
  }
  
  const progressPercent = ((currentCompileStage - 1) / 3) * 100;
  timelineProgress.style.width = `${progressPercent}%`;

  switch (currentCompileStage) {
    case 1:
      leftViewerTitle.innerText = "Source Code (C File)";
      rightViewerTitle.innerText = "Preprocessor Output (-E)";
      
      leftViewerBox.textContent = sourceCodeStr;
      rightViewerBox.textContent = preset.preprocessed.join('\n');
      btnNextStage.innerText = "Execute Compiler (Stage 2) →";
      break;
      
    case 2:
      leftViewerTitle.innerText = "Preprocessor Output (-E)";
      rightViewerTitle.innerText = "ARM Assembly Output (-S)";
      
      leftViewerBox.textContent = preset.preprocessed.join('\n');
      rightViewerBox.textContent = preset.assembly.join('\n');
      btnNextStage.innerText = "Execute Assembler (Stage 3) →";
      break;
      
    case 3:
      leftViewerTitle.innerText = "ARM Assembly Output (-S)";
      rightViewerTitle.innerText = "Object Machine Code Bytes (.o)";
      
      leftViewerBox.textContent = preset.assembly.join('\n');
      rightViewerBox.textContent = preset.object.join('\n');
      btnNextStage.innerText = "Execute Linker Script (Stage 4) →";
      break;
      
    case 4:
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
    compilationModal.classList.remove('active');
    compileModalActive = false;
    playClickSound(true);
    
    document.getElementById('btn-debugger-step').disabled = false;
    document.getElementById('btn-debugger-reset').disabled = false;
    
    initializeProgramSimulation();
    showToast("Program successfully compiled and mapped to SRAM/FLASH!", "success");
  }
});

// ==========================================
// 4. STEP DEBUGGER RUNTIME SOLVER
// ==========================================
let debuggerActiveLine = -1;
let simulationStepIndex = 0;
let programActive = false;

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

function initializeProgramSimulation() {
  resetMemorySimHTML();
  debuggerActiveLine = -1;
  simulationStepIndex = 0;
  programActive = true;
  activeSymbols = [];
  activeStack = [];
  activeHeap = [];
  nextAddressHeap = 0x20001008;

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

  // 3. Populate FLASH constants (.rodata)
  compiled.globals.filter(g => g.segment === '.rodata').forEach(g => {
    addFlashRodata(g.name, g.addr, g.initValExpr);
    activeSymbols.push({ name: g.name, storage: 'const', segment: '.rodata', addr: g.addr, val: g.initValExpr });
  });

  // 4. Populate SRAM globals (.data & .bss)
  compiled.globals.filter(g => g.segment === '.data').forEach(g => {
    const isVolatile = g.storage === 'volatile';
    addRamDataBlock(g.name, g.addr, g.initValExpr, isVolatile);
    activeSymbols.push({ name: g.name, storage: g.storage, segment: g.segment, addr: g.addr, val: g.initValExpr });
  });

  compiled.globals.filter(g => g.segment === '.bss').forEach(g => {
    addRamBssBlock(g.name, g.addr, '0x00000000');
    activeSymbols.push({ name: g.name, storage: g.storage, segment: g.segment, addr: g.addr, val: '0' });
  });

  updateSymbolTableHTML();
  writeGdbLog("target remote localhost:3333\nRemote connection established.\nLoading target binaries... OK\nLinker mapping complete. Entry point PC set to main().");
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
  
  // Position debugger overlay 👉
  positionExecutionArrow(debuggerActiveLine);

  // Execute C interpreter dynamic action
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

// ==========================================
// 5. HELPER SRAM/FLASH DRAW FUNCS
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
  
  updateCpuRegistersHud({ r0: 0, r1: 0, r2: 0, r3: 0 });
  document.getElementById('warning-stack-overflow').style.display = 'none';
}

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

// Stack controls
function pushStackFrame(name, addr, vars = []) {
  const frame = { name, addr, vars: [...vars] };
  activeStack.push(frame);
  
  renderStackHTML();
}

function renderStackHTML() {
  ramStackContainer.innerHTML = '<div class="ram-lbl-addr" style="text-align:right; font-size:0.6rem; border-bottom:1px dashed rgba(244,63,94,0.3); padding-bottom:2px; margin-bottom:4px;">SRAM High (0x20008000) &darr; Stack Grows Down</div>';
  
  // Render frames bottom-up (SRAM high to low)
  activeStack.forEach(frame => {
    const frameId = `stack-frame-${frame.name.replace(/[^a-zA-Z0-9]/g, '')}`;
    const frameDiv = document.createElement('div');
    frameDiv.className = 'ram-byte-block stack';
    frameDiv.id = frameId;
    
    let varsHtml = '';
    frame.vars.forEach(v => {
      varsHtml += `<div class="stack-var-row" id="var-${frameId}-${v.name}" style="display:flex; justify-content:space-between; width:100%; opacity:0.8; font-size:0.6rem;">
        <span style="color:#f43f5e;">&bull; ${v.name}:</span>
        <span class="var-val" style="color:var(--text-main); font-weight:bold;">${v.val}</span>
      </div>`;
    });

    frameDiv.innerHTML = `
      <div style="display:flex; flex-direction:column; width:100%; gap:4px;">
        <div style="display:flex; justify-content:space-between; width:100%; font-weight:bold;">
          <span style="color:var(--mem-stack)">[Frame] ${frame.name}</span>
          <span style="color:var(--text-dark);">${frame.addr}</span>
        </div>
        <div class="stack-vars-list" style="display:flex; flex-direction:column; width:100%; padding-left:10px;">
          ${varsHtml}
        </div>
      </div>
    `;
    
    ramStackContainer.appendChild(frameDiv);
  });
  
  checkStackHeapCollision();
}

function addStackVariable(frameName, name, val) {
  const frame = activeStack.find(f => f.name === frameName);
  if (frame) {
    frame.vars.push({ name, val });
    renderStackHTML();
  }
}

function updateStackVariableVal(frameName, name, val) {
  const frame = activeStack.find(f => f.name === frameName);
  if (frame) {
    const variable = frame.vars.find(v => v.name === name);
    if (variable) {
      variable.val = val;
      renderStackHTML();
    }
  }
}

function popStackFrame() {
  activeStack.pop();
  renderStackHTML();
}

// Heap controls
function addHeapBlock(id, addr, size, val) {
  const block = { id, addr, size, val };
  activeHeap.push(block);
  renderHeapHTML();
}

function renderHeapHTML() {
  ramHeapContainer.innerHTML = '<div class="ram-lbl-addr" style="font-size:0.6rem; border-top:1px dashed rgba(99,102,241,0.3); padding-top:2px; margin-top:4px;">Heap Grows Up &uarr; SRAM Low (0x20001000)</div>';
  
  activeHeap.forEach(block => {
    const blockDiv = document.createElement('div');
    blockDiv.className = 'ram-byte-block heap';
    blockDiv.id = `heap-block-${block.id}`;
    blockDiv.innerHTML = `
      <span class="ram-lbl-name" style="color:var(--mem-heap)">[Alloc] malloc(${block.size}) <span class="tag-class" style="font-size:0.5rem; background:rgba(99,102,241,0.15); color:var(--accent-indigo); padding:1px 3px;">heap</span></span>
      <span class="ram-lbl-val">${block.val}</span>
      <span class="ram-lbl-addr">${block.addr}</span>
    `;
    ramHeapContainer.appendChild(blockDiv);
  });
  
  checkStackHeapCollision();
}

function updateHeapValue(id, val) {
  const block = activeHeap.find(b => b.id === id);
  if (block) {
    block.val = val;
    renderHeapHTML();
  }
}

function removeHeapBlock(id) {
  activeHeap = activeHeap.filter(b => b.id !== id);
  renderHeapHTML();
}

// RAM overflow hazard triggers
function checkStackHeapCollision() {
  const warning = document.getElementById('warning-stack-overflow');
  if (activeStack.length + activeHeap.length >= 5) {
    warning.style.display = 'block';
  } else {
    warning.style.display = 'none';
  }
}

// Registers HUD updates
function updateCpuRegistersHud(regs) {
  for (const [r, val] of Object.entries(regs)) {
    const valEl = document.getElementById(`val-${r}`);
    if (valEl) {
      valEl.textContent = typeof val === 'number' ? val.toString(16).toUpperCase().padStart(2, '0') : val;
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
// 6. SYMBOL TABLE MATRICES
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
// 7. GDB DEBUGGER CONSOLE LOG
// ==========================================
const debuggerConsole = document.getElementById('debugger-console-log');

function writeGdbLog(text) {
  const lines = text.split('\n');
  
  lines.forEach(l => {
    const div = document.createElement('div');
    div.className = 'terminal-line';
    
    if (l.startsWith('target') || l.startsWith('load') || l.startsWith('Breakpoint')) {
      div.style.color = '#38bdf8';
    } else if (l.startsWith('Volatile') || l.startsWith('CPU') || l.startsWith('⚠️')) {
      div.style.color = '#fbbf24';
    } else if (l.startsWith('Exiting') || l.startsWith('Exit') || l.startsWith('Popping')) {
      div.style.color = '#f472b6';
    } else {
      div.style.color = '#a7f3d0';
    }
    
    div.textContent = (l.startsWith('target') ? '(gdb) ' : '') + l;
    debuggerConsole.appendChild(div);
  });
  
  debuggerConsole.scrollTop = debuggerConsole.scrollHeight;
}

// ==========================================
// 8. AUDIO FX & MODALS
// ==========================================
document.querySelectorAll('.btn-modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    compilationModal.classList.remove('active');
    compileModalActive = false;
  });
});

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
    // web audio blocked
  }
}

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

// Initial startup loads template
window.addEventListener('load', () => {
  loadTemplateIntoEditor();
});
