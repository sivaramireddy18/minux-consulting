# Microscopic Daily Vetting Specification
## Week 02, Day 4: The Compilation Sequence: Preprocessing, Symbols, and Linking

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 02 | Day 4
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Dissect the multi-stage compilation pipeline. Preprocessing expands macros, processes `#include` directives, and conditional compiles. The compiler translates to assembly. The assembler generates relocatable ELF objects. The linker maps relocatable sections, resolves symbols binding, and generates the final binary.

#### 🛠️ Unassisted Lab Track (4 Hours)
Run the GCC preprocessor on a source file containing macros using 'gcc -E' and inspect output. Compile files separately, and run 'objdump -t' to verify the symbols table binding states.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Simple multi-file symbols routing check
#include <stdint.h>

#define CORE_REGISTER_VAL 0x55U
extern uint32_t global_initialized;

uint32_t read_active_symbol(void) {
    return global_initialized + CORE_REGISTER_VAL;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Preprocess using '-E' to verify macro text expansion. Run 'nm' to verify undefined extern symbols bind cleanly during linking.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
