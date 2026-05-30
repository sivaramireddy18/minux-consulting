# Microscopic Daily Vetting Specification
## Week 02, Day 6: Linker Script Configurations and Memory Allocations

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 02 | Day 6
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study the architecture of Linker Scripts (.ld). Understand how the linker controls the layout of the final binary image. Learn the syntax of the MEMORY directive (declaring physical regions of FLASH and SRAM) and the SECTIONS directive (mapping compiler-output sections to physical regions).

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a custom linker script defining flash and RAM regions. Allocate a specific section '.ram_vector_table' at address `0x20000000`. Compile, and inspect code maps using a physical MAP file.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
/* Linker Script Syntax Structure */
MEMORY {
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 1024K
    SRAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

SECTIONS {
    .text : {
        *(.isr_vector)
        *(.text*)
    } > FLASH
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Check MAP file output. Ensure '.ram_vector_table' is allocated at address `0x20000000` with correct size bounds.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
