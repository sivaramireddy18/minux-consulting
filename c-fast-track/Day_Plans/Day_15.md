# Microscopic Daily Vetting Specification
## Phase 3: Stack & Execution Frame | Day 15: Stack Canaries and Buffer Overflow Defensive Coding

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 15 of 45 | Phase: Phase 3: Stack & Execution Frame
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Analyze how stack canaries guard activation frames from buffer overruns. Study the compiler flag '-fstack-protector-all'. Learn how the compiler places a sentinel value (canary) between local arrays and the saved stack pointers, checking its integrity before returning.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a C program containing a local array. Write a function that intentionally writes past the array bounds to trigger a stack smash crash. Compile with and without compiler stack-protector flags to observe the difference in safety.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Buffer Overrun Stack Canary Audit
#include <stdio.h>
#include <string.h>

void trigger_buffer_overrun(void) {
    char local_buffer[8];
    // Intentionally copying more bytes than allocated space
    // Overwriting the stack canary and saved return address
    strcpy(local_buffer, "OVERFLOW_STRING_LARGER_THAN_EIGHT");
    printf("Buffer content: %s\n", local_buffer);
}

int main(void) {
    printf("Starting safe execution...\n");
    trigger_buffer_overrun();
    printf("Execution completed successfully (Should not reach here if smashed!)\n");
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile using 'gcc -fstack-protector-all -O0 buffer_overrun.c'. Run the executable. Verify that it terminates with '*** stack smashing detected ***: terminated' and aborts.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
