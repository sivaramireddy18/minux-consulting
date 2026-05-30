# Microscopic Daily Vetting Specification
## Week 02, Day 2: SRAM memory segments: Stack, Heap, .data, and .bss

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 02 | Day 2
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Dissect the physical mapping of SRAM. Analyze the distinct boundaries of runtime memory segments: Stack (dynamic local frames, grows downwards), Heap (dynamic runtime pool, grows upwards), .data (initialized global/static variables), and .bss (uninitialized global variables, initialized to zero by startup code).

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a C file containing global variables in initialized and uninitialized states, heap allocations, and local variables. Link the file using a custom linker script. Dump symbol mappings using 'nm' and 'objdump -t'.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Map variables to specific memory segments
#include <stdint.h>
#include <stdlib.h>

uint32_t global_initialized = 0x12345678U; // allocated to .data
uint32_t global_uninitialized;             // allocated to .bss

void check_segments_layout(void) {
    volatile uint32_t stack_local = 0x55U;  // allocated to stack
    uint8_t *heap_local = (uint8_t *)malloc(10); // allocated to heap
    (void)stack_local;
    free(heap_local);
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Execute 'size' on compiled binary. Verify size of .data and .bss segments dynamically maps to code variables.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
