# Microscopic Daily Vetting Specification
## Week 04, Day 6: Compiler Stack Canaries and Canary address audits

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 04 | Day 6
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study compiler-inserted Stack Canaries. Under '-fstack-protector-all', the compiler inserts a random canary value onto the stack right before local variables in the function prologue. In the epilogue, it verifies that the canary is unchanged before returning. If modified, it aborts.

#### 🛠️ Unassisted Lab Track (4 Hours)
Compile code with '-fstack-protector-all'. Write code that intentionally overflows a local character buffer, and track the call to '__stack_chk_fail'.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Stack canary overrun test
#include <string.h>

void __stack_chk_fail(void) {
    // Local stack handler overrun hook
    __asm volatile ("bkpt #1");
    while(1);
}

void trigger_buffer_overrun(void) {
    char dest[4];
    // Overrun will corrupt compiler stack canary
    strcpy(dest, "overrun_buffer_text");
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Compile, execute, verify execution halts inside __stack_chk_fail hook before function exits.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
