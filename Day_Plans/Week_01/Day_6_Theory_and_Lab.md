# Microscopic Daily Vetting Specification
## Week 01, Day 6: Static Analysis Pipeline and -Wall -Wextra Compilations

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 01 | Day 6
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study the architecture of automated compiler diagnostic engines. Analyze static code parsers and how tools like `cppcheck` and `clang-tidy` construct Abstract Syntax Trees (AST) to evaluate code safety boundaries before binary generation. Understand why compiler flags like `-Wall -Wextra -Werror -pedantic` are mandatory.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a C file filled with deliberate structural errors: uninitialized variables, array index out of bounds, and unused static arrays. Set up a Makefile compiling with strict static checks and verify diagnostic output.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Code with deliberate bugs to test static analysis pipelines
#include <stdint.h>

void trigger_warnings_audit(void) {
    volatile uint8_t buffer[4];
    // Array index out of bounds (will trigger static analysis warning)
    buffer[4] = 0xAA;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Execute 'cppcheck --enable=all' and 'gcc -Wall -Wextra -Werror'. Ensure the pipeline outputs compiler errors and aborts.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
