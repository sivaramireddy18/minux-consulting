# Microscopic Daily Vetting Specification
## Phase 2: Data & Radix Hazards | Day 09: Bitwise Operations, Masking, and Shift Hazards

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 09 of 45 | Phase: Phase 2: Data & Radix Hazards
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Analyze low-level bit manipulation techniques. Understand logical AND, OR, XOR, and NOT operations. Master shifting properties (logical vs arithmetic right shifts) and the undefined behavior of shifting by a value equal to or greater than the operand bit-width. Implement safe bitmasking interfaces.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write functions to set, clear, toggle, and read bit-states inside status registers. Verify that right-shifting a signed negative value performs an arithmetic shift (preserving sign) while shifting an unsigned value performs a logical shift (padding with zeroes).

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Bitwise register manipulations and shift behavior validations
#include <stdint.h>
#include <stdbool.h>

#define STATUS_BIT_ERROR   (1U << 0)
#define STATUS_BIT_BUSY    (1U << 1)
#define STATUS_BIT_READY   (1U << 2)
#define STATUS_REG_MASK    (0x07U)

void set_status_bit(volatile uint32_t *reg, uint32_t mask) {
    *reg |= mask;
}

void clear_status_bit(volatile uint32_t *reg, uint32_t mask) {
    *reg &= ~mask;
}

bool read_status_bit(volatile uint32_t reg, uint32_t mask) {
    return (reg & mask) != 0U;
}

int32_t arithmetic_right_shift(int32_t val, uint32_t shift_amount) {
    // Avoid undefined behavior of shifting beyond bit-width
    if (shift_amount >= 32) return 0;
    return val >> shift_amount; // Compiler issues ASR (Arithmetic Shift Right) for signed
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile code and trace with GDB. Verify the assembly of signed right shift translates to 'sar' (x86) or 'asr' (ARM), while unsigned shift translates to 'shr' or 'lsr'.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
