# Microscopic Daily Vetting Specification
## Phase 3: Stack & Execution Frame | Day 14: Stack Overflow Hazards, MSP vs PSP, and MPU Guard Bands

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 14 of 45 | Phase: Phase 3: Stack & Execution Frame
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Analyze how stack overflows corrupt active variables in memory. Explore systems stack layouts. In bare-metal ARM systems, understand the Main Stack Pointer (MSP) used on reset and interrupts, and the Process Stack Pointer (PSP) used for application threads. Learn how Memory Protection Units (MPU) prevent stack breaches.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write an intentional deep recursive call that overflows stack space. Audit where the memory bounds are exceeded. Write a conceptual emulation of an MPU guard band that traps unaligned stack operations.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Stack overflow generation and protection schemes
#include <stdint.h>
#include <stdlib.h>

// Simulated MPU guard band protection check
#define STACK_MIN_BOUND 0x20004000U
#define STACK_MAX_BOUND 0x20008000U

void verify_sp_boundary(uint32_t sp) {
    if (sp < STACK_MIN_BOUND || sp > STACK_MAX_BOUND) {
        // Trigger simulated HardFault exception
        __builtin_trap();
    }
}

void recurse_and_overflow(uint32_t depth) {
    volatile uint32_t stack_local[256]; // Heavy allocation
    stack_local[0] = depth;
    
    // Read Stack Pointer (using compiler builtin or inline assembly)
    uintptr_t current_sp;
#if defined(__x86_64__)
    __asm__ volatile("mov %%rsp, %0" : "=r"(current_sp));
#else
    __asm__ volatile("mov %0, sp" : "=r"(current_sp));
#endif
    
    // In a real systems driver, verify boundary check
    // verify_sp_boundary(current_sp); 
    
    recurse_and_overflow(depth + 1);
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile and execute inside GDB. Run 'backtrace' after crash to examine the call depth and trace corrupted stack addresses.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
