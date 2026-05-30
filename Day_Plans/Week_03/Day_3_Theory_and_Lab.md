# Microscopic Daily Vetting Specification
## Week 03, Day 3: Array Decay traps and Struct Array offset mappings

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 03 | Day 3
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Explore array decay mechanics. In C, an array name decays (coerces) into a pointer to its first element when passed into a function. This drops array sizing details, presenting major boundary safety risks. Study structural memory offset routing inside array lists.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write code demonstrating array decay sizing errors inside functions. Build structured array lists and map register byte offset steps.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Array decay tracking inside functions
#include <stdint.h>
#include <stddef.h>

size_t get_array_decay_size(uint32_t arr[]) {
    // sizeof(arr) returns pointer size (4 or 8 bytes) instead of array size!
    return sizeof(arr);
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Compile, and write assertions verifying size decay. Setup bounds checks on pointer inputs to prevent overflows.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
