# Microscopic Daily Vetting Specification
## Phase 1: Compiler & Toolchains | Day 04: Linking Mechanics, Static/Dynamic Libraries, and Symbol Collisions

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 04 of 45 | Phase: Phase 1: Compiler & Toolchains
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Explore the linking phase (ld). Learn how multiple object files are combined into a single executable, how references to external symbols are resolved, and how static (.a) and shared/dynamic (.so) libraries differ. Study symbol resolution rules (strong vs weak symbols) and the danger of silent symbol collisions.

#### 🛠️ Unassisted Lab Track (4 Hours)
Create two separate C files that define the same global variable name (one initialized, one uninitialized). Attempt to link them and observe the linker warning/error. Create a static library and a dynamic library, compile a main driver, and inspect the runtime load paths (LD_LIBRARY_PATH and rpath).

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Static vs Shared Linkage and dynamic loading demo
// file: math_ops.c
#include <stdint.h>

// Define a strong symbol
uint32_t math_op_multiplier = 42U;

uint32_t scale_value(uint32_t val) {
    return val * math_op_multiplier;
}

// Compile with:
// gcc -fPIC -shared math_ops.c -o libmathops.so
// gcc -c main.c
// gcc main.o -L. -lmathops -o linked_app
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile dynamic library using '-fPIC -shared'. Link application with '-Wl,-rpath,.'. Run 'ldd linked_app' to verify the runtime link dependency is successfully resolved to libmathops.so.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
