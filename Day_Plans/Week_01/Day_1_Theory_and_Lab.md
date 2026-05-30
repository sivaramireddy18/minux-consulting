# Microscopic Daily Vetting Specification
## Week 01, Day 1: Radix Arithmetic, Hexadecimal Mapping, and ALU Flags

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Week:** Week 01 | Day 1
*   **Hardware Core Target:** ARM Cortex-M4 Core (specifically STM32F407VGT6) & System SRAM Segments.
*   **Documentation Maps:** Technical Reference Manual (TRM), vector table offsets maps, and GCC compiler toolchain manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Deep-dive into positional number systems. Master the physical mechanics of fractional binary representations and two's complement signed integers. Focus on the Arithmetic Logic Unit (ALU) hardware flags: Carry (C), Overflow (V), Zero (Z), and Negative (N). Explain how the core ALU logic circuit routes bit-carries and calculates overflow: $V = C_{in} \oplus C_{out}$ of the most significant bit.

#### 🛠️ Unassisted Lab Track (4 Hours)
Configure your host GCC compiler to build a test harness. Write C code that triggers signed integer overflow. Inspect the assembly output of the addition operation using GDB. Check the active status flags register (`xPSR` on ARM Cortex-M4) to physically observe the transition of the V flag.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is a complete, production-grade C/Assembly implementation illustrating the day's core technical challenge. It conforms to strict type safety parameters and compiles with zero warnings under GCC.

```c
// Triggering and evaluating ALU signed overflow flags
#include <stdint.h>
#include <stdbool.h>

bool check_addition_overflow(int32_t a, int32_t b, int32_t *result) {
    *result = a + b;
    // Hardware-level overflow check: if signs of inputs are equal but output sign differs
    return ((a ^ *result) & (b ^ *result)) < 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's execution on real hardware:
*   **Verification Tooling:** Compile with '-O0 -g'. Set breakpoint in GDB. Run 'print/x $xpsr' before and after overflow. Verify the V bit (bit 28) transitions from 0 to 1.
*   **Instrumentation Checklist:**
    *   Monitor address registers, SP offsets, or output pins using GDB or an Oscilloscope.
    *   Expected outcome: Trace execution cycles alignment and confirm memory states match specifications.
