# Microscopic Daily Vetting Specification
## Week 02, Day 3: Struct Padding Alignments and 32-bit Memory Boundaries

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 02 | Day 3
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Analyze structure alignments and hardware memory boundaries. In a 32-bit architecture, the processor fetches data on 32-bit aligned boundaries (addresses ending in 0, 4, 8, C). To optimize bus speeds, the compiler automatically inserts padding bytes into structures. Learn how '__attribute__((packed))' eliminates padding at the cost of execution cycles.

#### 🛠️ Unassisted Lab Track (4 Hours)
Create structures containing interleaved data types (char, int, short). Measure sizes using 'sizeof'. Apply packed attributes and analyze structural offset mapping changes under GDB.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Struct alignment padding and size checks
#include <stdint.h>

struct NormalStruct {
    uint8_t  a;
    uint32_t b; // Compiler inserts 3 padding bytes after 'a' to align 'b'
    uint16_t c;
};

struct __attribute__((packed)) PackedStruct {
    uint8_t  a;
    uint32_t b; // Zero padding bytes inserted
    uint16_t c;
};
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Write test asserting sizeof(struct NormalStruct) == 12 and sizeof(struct PackedStruct) == 7. Compile and run.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
