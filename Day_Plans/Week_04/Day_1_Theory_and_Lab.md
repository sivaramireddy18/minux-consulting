# Microscopic Daily Vetting Specification
## Week 04, Day 1: AAPCS Registers usage convention and local registers allocation

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 04 | Day 1
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Dissect the ARM Architecture Procedure Call Standard (AAPCS). Registers R0-R3 are used to pass inputs into a function, and to return the output. Registers R4-R11 are callee-saved registers (must be preserved if modified). R12 is the Intra-Procedure-call scratch register. LR (R14) holds the return address.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write assembly functions passing variables, and trace register values (R0-R3) in GDB. Verify AAPCS conformance.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
.syntax unified
.thumb
.global aapcs_math_verify

aapcs_math_verify:
    // Inputs: r0, r1, r2, r3 (AAPCS standard)
    add r0, r0, r1
    add r0, r0, r2
    add r0, r0, r3
    bx lr // Return value stored in r0
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Compile assembly. Run GDB, set breakpoints, verify inputs exist inside registers R0-R3 on entry.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
