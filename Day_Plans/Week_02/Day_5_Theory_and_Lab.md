# Microscopic Daily Vetting Specification
## Week 02, Day 5: Compiler Optimizations -O0 to -Os, Reordering, and Volatile

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 02 | Day 5
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Analyze the internal mechanics of compiler optimizations. At higher levels (-O2, -O3, -Os), the compiler reorders instructions, eliminates dead code paths, and caches values in CPU core registers. Learn why 'volatile' is the only protection mechanism to prevent register-caching during hardware status checks.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a delay loop counting to 1,000,000 without volatile. Compile it at '-O0' and '-O3'. Observe how the compiler completely eliminates the '-O3' loop as dead code. Re-insert volatile and verify loop preservation.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Loop optimization suppression test
#include <stdint.h>

void delay_cycles_loop(void) {
    // Without volatile, compiler eliminates this loop under -O3
    volatile uint32_t counter = 0;
    while (counter < 100000U) {
        counter++;
    }
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Disassemble '-O3' binary. Ensure loop assembly instructions are present and execute correct loop cycles.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
