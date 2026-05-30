# Microscopic Daily Vetting Specification
## Phase 2: Data & Radix Hazards | Day 06: POSIX Integer Scales, Two's Complement, and Sign Extensions

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 06 of 45 | Phase: Phase 2: Data & Radix Hazards
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Master the physical bit representations of signed and unsigned integers under two's complement. Study radix conversions (binary, octal, hexadecimal, decimal). Understand sign extension rules when converting smaller signed types (int8_t) to larger types (int32_t) versus zero-extension for unsigned types.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write C code that assigns negative integers to signed small types, casts them to unsigned and larger signed types, and prints their raw hexadecimal bytes. Verify sign extension behavior on real hardware registers using GDB.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Sign Extension and Two's Complement bit verification
#include <stdio.h>
#include <stdint.h>

int main(void) {
    int8_t negative_val = -5; // 0xFB in hex
    
    // Sign extension: high bits are filled with 1s
    int32_t sign_extended = (int32_t)negative_val; 
    
    // Zero extension: high bits are filled with 0s
    uint32_t zero_extended = (uint32_t)(uint8_t)negative_val;
    
    printf("Original int8_t: %d (0x%02X)\n", negative_val, (uint8_t)negative_val);
    printf("Sign Extended int32_t: %d (0x%08X)\n", sign_extended, sign_extended);
    printf("Zero Extended uint32_t: %u (0x%08X)\n", zero_extended, zero_extended);
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile and run. Verify the hex output for sign_extended is 0xFFFFFFFB and zero_extended is 0x000000FB.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
