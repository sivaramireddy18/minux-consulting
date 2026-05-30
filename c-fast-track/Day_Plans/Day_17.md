# Microscopic Daily Vetting Specification
## Phase 4: Pointers & Arithmetic | Day 17: Pointer Arithmetic Scaling Mathematics and Offset Mapping

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Day:** Day 17 of 45 | Phase: Phase 4: Pointers & Arithmetic
*   **Hardware Core Target:** Elite Embedded Systems CPU (ARM Cortex-M4 Architecture or x86_64 POSIX System Boundaries).
*   **Documentation Maps:** Technical Reference Manual (TRM), Vector Table Mapping, and Compiler Toolchain Manuals.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand that pointer arithmetic is typed: adding 1 to a pointer increments its target address by the size of the underlying type (e.g. 4 bytes for int32_t, 1 byte for char). Study pointer offsets, void pointer restrictions, and uintptr_t casts for absolute address arithmetic.

#### 🛠️ Unassisted Lab Track (4 Hours)
Create an array containing multiple types. Perform pointer increments using different typed pointers, and print the raw addresses before and after addition. Verify address modifications conform to underlying type byte alignments.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following C/Assembly implementation demonstrates the core technical challenge of the day. It compiles with zero warnings under GCC with strict compiler flags (`-Wall -Wextra -Werror -pedantic`).

```c
// Pointer arithmetic scaling calculations
#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint32_t u32_arr[4] = {100, 200, 300, 400};
    uint8_t  u8_arr[4]  = {1, 2, 3, 4};
    
    uint32_t *p_u32 = u32_arr;
    uint8_t  *p_u8  = u8_arr;
    
    printf("p_u32 Address: %p, p_u32 + 1 Address: %p (Diff: %ld bytes)\n", 
           (void *)p_u32, (void *)(p_u32 + 1), (uintptr_t)(p_u32 + 1) - (uintptr_t)p_u32);
           
    printf("p_u8 Address:  %p, p_u8 + 1 Address:  %p (Diff: %ld bytes)\n", 
           (void *)p_u8, (void *)(p_u8 + 1), (uintptr_t)(p_u8 + 1) - (uintptr_t)p_u8);
    return 0;
}
```

---

### 4. Post-Silicon Validation & Instrumentation Plan

To verify this day's work on physical hardware or host compiler contexts:
*   **Verification Tooling:** Compile and execute. Verify that the address difference for the uint32_t pointer is exactly 4 bytes, while the difference for the uint8_t pointer is exactly 1 byte.
*   **Instrumentation Checklist:**
    *   Monitor processor registers, memory segments, or output status using GDB or an Oscilloscope.
    *   Assert that runtime metrics and compilation outputs match the criteria defined above.
