# Microscopic Daily Vetting Specification
## Phase 2: Data & Radix Hazards | Day 08: Floating-Point Internals (IEEE 754) and Precision Hazards

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 08 of 45 | Phase: Phase 2: Data & Radix Hazards
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Study the internal physical binary format of floating-point numbers according to the IEEE 754 standard (sign bit, exponent, significand/mantissa). Explore precision limits, round-off errors, and the dangers of comparing floats directly using standard equality operators (==). Master the epsilon-based comparison technique.

#### 🛠️ Unassisted Lab Track (4 Hours)
Write code that sums small float numbers recursively and compare it to a direct multiplication. Observe the rounding drift. Write a precise floating point comparator using custom epsilon values tailored to float precision scales.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Floating Point IEEE 754 precision audit and safe comparisons
#include <stdio.h>
#include <stdbool.h>
#include <math.h>

#define EPSILON 1e-6f

bool safe_float_compare(float a, float b) {
    return fabsf(a - b) < EPSILON;
}

int main(void) {
    float sum = 0.0f;
    for (int i = 0; i < 10; ++i) {
        sum += 0.1f;
    }
    
    float direct = 1.0f;
    
    printf("Recursive Sum: %.10f\n", sum);
    printf("Direct Value:  %.10f\n", direct);
    
    if (sum == direct) {
        printf("Direct check: EQUAL\n");
    } else {
        printf("Direct check: NOT EQUAL (Rounding drift occurred!)\n");
    }
    
    if (safe_float_compare(sum, direct)) {
        printf("Epsilon check: EQUAL (Safe comparison passed)\n");
    }
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile and execute. Observe that the recursive sum is not exactly 1.0f due to base-2 float precision limits, and verify the epsilon check successfully resolves the comparison.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
