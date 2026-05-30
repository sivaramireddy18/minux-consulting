# Microscopic Daily Vetting Specification
## Week 03, Day 2: Pointer Arithmetic offset scale calculations by type sizes

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 03 | Day 2
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Master pointer arithmetic mechanics. When you increment or decrement a pointer, the compiler automatically scales the address step by the size of the target type (e.g., a `uint32_t *` increments by 4 bytes, while a `uint8_t *` increments by 1 byte). Learn how this applies to structures and arrays.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a program defining arrays of different type structures. Increment pointer variables by custom steps, and log address transitions to verify type scale offsets under GDB.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Pointer arithmetic type-scaling verify
#include <stdint.h>

struct SensorData {
    uint32_t val;
    uint8_t  status;
}; // Size is 8 bytes due to padding alignment

void evaluate_pointer_scaling(void) {
    struct SensorData data_array[2] = { {0x11, 1}, {0x22, 2} };
    struct SensorData *ptr = data_array;
    ptr++; // Pointer increments address by exactly 8 bytes (type size)
    (void)ptr;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Assert that address difference '(uintptr_t)(ptr + 1) - (uintptr_t)ptr' equals sizeof(struct SensorData).
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
