# Microscopic Daily Vetting Specification
## Phase 1: Compiler & Toolchains | Day 02: Compilation to Assembly and GDB Register Analysis

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 02 of 45 | Phase: Phase 1: Compiler & Toolchains
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Analyze how the compiler translates preprocessed intermediate C code into assembly instructions specific to the target CPU architecture. Study ARMv7-M / x86-64 register structures, instruction sizing, and the translation of loops and branching statements into conditional branches. Master GDB commands for register inspection.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a C function containing a nested loop and conditional branch. Compile the code to raw assembly using the '-S' flag. Inspect the assembly output to trace label naming conventions. Load the executable under GDB, set breakpoints, step instruction-by-instruction ('si'), and print register contents to see loops incrementing registers directly.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// GDB register analysis and assembly mapping
#include <stdint.h>

__attribute__((noinline)) uint32_t compute_factorial_sum(uint32_t limit) {
    uint32_t total = 0;
    for (uint32_t i = 1; i <= limit; ++i) {
        uint32_t fact = 1;
        for (uint32_t j = 1; j <= i; ++j) {
            fact *= j;
        }
        total += fact;
    }
    return total;
}

int main(void) {
    volatile uint32_t result = compute_factorial_sum(5);
    (void)result;
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile with 'gcc -S -g -O0 factorial.c'. Load factorial.o into GDB. Run 'layout asm' and 'info registers' to physically observe register status updates (e.g. EAX/RAX changes) during execution steps.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
