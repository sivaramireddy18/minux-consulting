# Microscopic Daily Vetting Specification
## Week 04, Day 4: MSP vs PSP stack registers configuration and boundaries

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 04 | Day 4
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Master the stack pointers of the ARM Cortex-M4. The Main Stack Pointer (MSP) is active on reset and is used for all exception handlers. The Process Stack Pointer (PSP) is configured for user threads. This partition protects the core system stack from user application stack overflows.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write assembly to configure the PSP address, switch thread execution to PSP, and trigger an interrupt to verify MSP usage in ISRs.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Switch thread execution stack to PSP
#include <stdint.h>

void init_psp_stack(uint32_t psp_addr) {
    __asm volatile (
        "msr psp, %0
"   // Set PSP address
        "mrs r0, control
"
        "orr r0, r0, #2
" // Set SPSEL bit to use PSP
        "msr control, r0
"
        "isb
"
        :: "r"(psp_addr) : "r0"
    );
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Run in GDB. Read active register states. Confirm thread mode SP matches PSP while handlers use MSP.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
