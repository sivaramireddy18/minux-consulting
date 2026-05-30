# Microscopic Daily Vetting Specification
## Phase 3: Stack & Execution Frame | Day 13: Local Variable Lifetimes, Storage Classes, and Scope Boundaries

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 13 of 45 | Phase: Phase 3: Stack & Execution Frame
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Explore variables lifetimes and scopes. Study storage class specifiers ('static', 'extern', 'register', 'auto'). Understand how local static variables preserve state between function invocations by mapping to the global .data/.bss memory segment, rather than the stack frame.

#### 🛠️ Unassisted Lab Track (4 Hours)
Create functions demonstrating variables with varying lifetimes (auto, local static, register allocation). Set up variables, track their memory addresses, and verify that stack local addresses change across calls while static addresses remain permanent.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Lifetime and Scope Storage classes validation
#include <stdio.h>
#include <stdint.h>

uint32_t *get_unsafe_stack_ptr(void) {
    uint32_t local_stack_var = 42U;
    return &local_stack_var; // WARNING: RETURNING ADDRESS OF STACK VARIABLE (DANGEROUS)
}

uint32_t *get_safe_static_ptr(void) {
    static uint32_t local_static_var = 42U; // Allocated in global segment
    return &local_static_var; // Safe to return address
}

int main(void) {
    uint32_t *p_unsafe = get_unsafe_stack_ptr();
    uint32_t *p_safe = get_safe_static_ptr();
    
    printf("Safe Static Address: %p, Value: %u\n", (void *)p_safe, *p_safe);
    printf("Unsafe Stack Address (may be corrupted or trap): %p\n", (void *)p_unsafe);
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile with 'gcc -Wall -Wextra'. Verify that the compiler issues a warning warning: function returns address of local variable. Run the program to verify stability.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
