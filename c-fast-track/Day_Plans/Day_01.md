# Microscopic Daily Vetting Specification
## Phase 1: Compiler & Toolchains | Day 01: The Preprocessor Pipeline and Macro Expansion Hazards

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 01 of 45 | Phase: Phase 1: Compiler & Toolchains
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Deep-dive into the C Preprocessor (cpp). Understand header file inclusion (#include), conditional compilation (#ifdef, #if defined), and macro expansions. Study macro hazards such as side-effects, double evaluations, and operator precedence issues. Learn how compiler flags like '-E' produce intermediate '.i' files containing expanded text before tokenization.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write a complex nested macro system that calculates the square of a number and absolute values. Create a source file main.c, run it through the preprocessor using 'gcc -E' and inspect the generated '.i' file. Identify where the macro expansions occur and explain why double evaluation of side-effect expressions (e.g., ++x) leads to logical corruption.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Demonstration of Safe vs Unsafe Macros and Preprocessor Outputs
#include <stdio.h>

// UNSAFE: Double evaluation hazard
#define SQUARE_UNSAFE(x) ((x) * (x))

// SAFE: C11 _Generic or inline function behaves correctly with side-effects
static inline int square_safe(int x) {
    return x * x;
}

int main(void) {
    int val = 5;
    int unsafe_res = SQUARE_UNSAFE(++val); // Preprocessor expands to ((++val) * (++val))
    printf("Unsafe ++val Square: %d (Expected 36, got 42 or similar due to double increment)\n", unsafe_res);
    
    val = 5;
    int safe_res = square_safe(++val); // Inline function evaluates ++val exactly once
    printf("Safe ++val Square: %d (Expected 36)\n", safe_res);
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile with 'gcc -std=c11 -Wall -Wextra -Werror -O0'. Run 'gcc -E main.c' and verify that the preprocessor expands SQUARE_UNSAFE(++val) directly in the source text, while square_safe remains a standard function call boundary.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
