# Microscopic Daily Vetting Specification
## Phase 3: Stack & Execution Frame | Day 12: Function Frame Layout, Prologue, and Epilogue Assembly

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 12 of 45 | Phase: Phase 3: Stack & Execution Frame
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand the call stack structure. Explore how stack frames are constructed on the stack. Study the function prologue: pushing caller context registers, establishing the frame pointer, and decrementing the stack pointer to allocate local memory variables. Study the matching epilogue operations.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write nested functions that instantiate arrays on the stack. Compile the code with zero optimization, generate the assembly output, and identify the 'push', 'pop', and SP manipulation instructions that define the frame's lifetime.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Deep audit of frame prologue and epilogue stack moves
#include <stdint.h>

__attribute__((noinline)) void inner_function(uint32_t *p_val) {
    volatile uint32_t internal_array[4] = {0xA, 0xB, 0xC, 0xD};
    *p_val += internal_array[2];
}

__attribute__((noinline)) void outer_function(void) {
    volatile uint32_t active_state = 100U;
    inner_function((uint32_t *)&active_state);
}

int main(void) {
    outer_function();
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile to assembly with 'gcc -S -O0 frame.c'. Open 'frame.s', locate the assembly labels for 'outer_function' and 'inner_function', and find the matching SP modifications and PUSH/POP commands.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
