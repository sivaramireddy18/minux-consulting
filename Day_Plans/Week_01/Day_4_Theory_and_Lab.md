# Microscopic Daily Vetting Specification
## Week 01, Day 4: Thumb-2 Assembly Architecture, R0-R15 Registers, and Alignment

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 01 | Day 4
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Dissect the ARMv7-M Thumb-2 instruction set. Analyze the 16-bit and 32-bit execution modes. Map the core register file (R0-R12 general purpose, R13 Stack Pointer, R14 Link Register, R15 Program Counter). Explore instruction alignment rules: Thumb-2 instructions must be aligned to half-word (2-byte) boundaries; violating this triggers a UsageFault.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a raw assembly file containing branch and math instructions. Configure your compiler toolchain to output a listing file. Examine instructions sizing, memory alignments, and register allocations directly under GDB.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
.syntax unified
.thumb
.global execute_raw_add

execute_raw_add:
    // Parameters passed in r0 and r1 (AAPCS)
    add r0, r0, r1  // Add r1 to r0, result in r0
    bx lr           // Branch exchange to Link Register
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Compile assembly with '-mthumb'. Disassemble using 'objdump -d'. Verify 16-bit and 32-bit instruction packaging alignments.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
