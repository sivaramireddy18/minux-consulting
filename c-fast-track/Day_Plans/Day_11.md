# Microscopic Daily Vetting Specification
## Phase 3: Stack & Execution Frame | Day 11: Activation Records and Procedure Call Standards (AAPCS)

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 11 of 45 | Phase: Phase 3: Stack & Execution Frame
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Explore how function calls are orchestrated physically at the machine boundary. Study the ARM Architecture Procedure Call Standard (AAPCS) or System V ABI for x86-64. Learn which registers are used for input parameters (R0-R3 / RDI, RSI, RDX, RCX), return values, and callee-saved scratch registers.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a multi-parameter C function that takes 6 arguments. Compile the code and dissect the assembly output to locate exactly where arguments are passed (registers vs stack allocation). Tracing registers state step-by-step under GDB.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// AAPCS parameters passing trace
#include <stdint.h>

// The first 4 arguments fit into R0-R3 (ARM) or RDI/RSI/RDX/RCX (x86_64)
// Remaining arguments are pushed onto the calling function's stack frame
__attribute__((noinline)) uint32_t sum_six_params(uint32_t a, uint32_t b, uint32_t c, 
                                                 uint32_t d, uint32_t e, uint32_t f) {
    return a + b + c + d + e + f;
}

int main(void) {
    volatile uint32_t total = sum_six_params(1, 2, 3, 4, 5, 6);
    (void)total;
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile and run GDB. Place a breakpoint on sum_six_params. Check register contents before step execution to verify input parameter bounds.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
