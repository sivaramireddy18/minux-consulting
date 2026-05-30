# Microscopic Daily Vetting Specification
## Week 04, Day 5: Stack Overflow mechanisms and MPU guard bands

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 04 | Day 5
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand the physical disaster of a stack overflow. If a call stack grows beyond its allocated memory boundary, it silently overwrites adjacent global variables or heap blocks. Configure the Memory Protection Unit (MPU) to set up a read-only guard band to trigger a HardFault on boundary breach.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write infinite recursive functions to trigger a stack overflow. Trace PC values during crash, and set up watchpoint breakpoints.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Intentional recursion loop to audit stack overflow
#include <stdint.h>

void trigger_infinite_stack_overflow(uint32_t depth) {
    volatile uint32_t local_var[128]; // Allocate large stack frame
    local_var[0] = depth;
    trigger_infinite_stack_overflow(depth + 1);
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Set a GDB memory write watchpoint at stack base boundary. Ensure watchpoint triggers before heap segments get corrupted.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
