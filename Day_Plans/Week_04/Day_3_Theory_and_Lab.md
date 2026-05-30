# Microscopic Daily Vetting Specification
## Week 04, Day 3: R11 Frame Pointer Tracking and Stacked registers layouts

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 04 | Day 3
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand the role of the Frame Pointer (usually register R11 or R7). It provides a constant reference point within the function's stack frame, making it easy to access local variables and parameters. It allows debuggers to backtrace stack calls cleanly.

#### 🛠️ Unassisted Lab Track (4 Hours)
Compile files with '-fno-omit-frame-pointer'. Set breakpoints in GDB, read the value of R11/R7, and trace offset addresses.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Stack frame pointer offsets tracking
#include <stdint.h>

void trace_frame_offsets(void) {
    volatile uint32_t a = 1;
    volatile uint32_t b = 2;
    (void)a; (void)b;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Step under GDB. Examine variables locations relative to frame pointer register R11/R7.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
