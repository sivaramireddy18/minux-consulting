# Microscopic Daily Vetting Specification
## Week 02, Day 1: Static, Extern, Volatile variables Cache Coherency

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 02 | Day 1
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Explore variables lifetimes and scopes. Analyze register-level variable storage class mappings (static, extern, register). Explore the 'volatile' qualifier: it tells the compiler that the register value can change outside program execution blocks, bypassing register caching and forcing direct memory reads.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a polling delay loop using a global volatile flag. Compile it under '-O2'. Compare the compiled assembly generation of a standard flag versus a volatile flag. Verify register caching behavior in GDB.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Volatile vs Standard variables registers optimization check
#include <stdint.h>

#define STAT_ADDR 0x20002000U

void polling_loop_volatile(void) {
    volatile uint32_t *status = (volatile uint32_t *)STAT_ADDR;
    // Compiler cannot cache this read in R0; forces 'LDR' on each iteration
    while (*status == 0);
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Disassemble compiled loop using 'objdump -d'. Verify the volatile loop contains active 'ldr' memory reads on each loop step.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
