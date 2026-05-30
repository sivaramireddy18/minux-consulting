# Microscopic Daily Vetting Specification
## Week 03, Day 1: Raw Address Casting, Void Pointer Casting, and Registers

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 03 | Day 1
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Master raw address pointer casting. In systems programming, memory-mapped peripheral registers are controlled by casting literal physical address integers into pointers to volatile variables. Understand why explicit type casting is mandatory.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write code to cast raw address registers of the GPIO peripheral, write configuration registers using bit masks, and inspect memory updates inside GDB.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Raw memory-mapped register pointer access
#include <stdint.h>

#define REG_CONTROL_ADDR 0x40020000U
#define REG_CONTROL      (*(volatile uint32_t *)REG_CONTROL_ADDR)

void init_control_register(void) {
    // Force direct volatile cast write to physical memory address
    REG_CONTROL = 0x01U;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Step through register writes in GDB. Execute 'x/1xw 0x40020000' to confirm memory update.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
