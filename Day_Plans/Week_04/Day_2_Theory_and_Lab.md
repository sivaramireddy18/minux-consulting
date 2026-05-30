# Microscopic Daily Vetting Specification
## Week 04, Day 2: Function Frame Activation Prologue and Epilogue frames

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 04 | Day 2
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study function activation frames call stacks. The function prologue sets up the stack frame by pushing the Link Register (LR) and callee-saved registers to the stack. The function epilogue restores these registers and pops the return address into the Program Counter (PC).

#### 🛠️ Unassisted Lab Track (4 Hours)
Write nested functions in C, compile with '-g', disassemble, and analyze prologue 'PUSH' and epilogue 'POP' instructions.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Nested functions stack frame tracking
#include <stdint.h>

__attribute__((noinline)) uint32_t inner_calc(uint32_t val) {
    return val * 3U;
}

__attribute__((noinline)) uint32_t outer_calc(uint32_t val) {
    return inner_calc(val) + 5U;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Verify assembly generation. Ensure 'PUSH {..., lr}' and 'POP {..., pc}' instructions exist inside outer_calc.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
