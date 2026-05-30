# Microscopic Daily Vetting Specification
## Week 03, Day 6: Pointer Boundary Safety Checks and Unaligned Cast traps

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 03 | Day 6
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study pointer boundary safety. Unaligned memory access occurs when you read or write data of size $S$ bytes from a memory address that is not a multiple of $S$ bytes. Accessing unaligned addresses on strict architectures triggers a hardware exception (UsageFault).

#### 🛠️ Unassisted Lab Track (4 Hours)
Write code to cast unaligned byte arrays into 32-bit integers. Run under strict compilers, and verify alignment exception trap gates.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Checking pointer address alignments
#include <stdint.h>
#include <stdbool.h>

bool is_ptr_aligned(const void *ptr, uint32_t alignment) {
    return ((uintptr_t)ptr & (alignment - 1)) == 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Write test casting unaligned array variables. Assert that alignment check function detects invalid boundaries.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
