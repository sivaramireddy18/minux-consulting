# Microscopic Daily Vetting Specification
## Week 03, Day 4 (Thursday): The Power of keywords - Volatile and Const

---

### 1. Architectural Alignment & Reference Manifest
*   **Target Phase:** Phase Vetting Alignment
*   **Target Week & Day:** Week 03 | Day 4 (Thursday)
*   **Core Systems Topic:** The Power of keywords - Volatile and Const
*   **Documentation Map:** Silicon datasheets, compiler architecture manuals, and POSIX standard specs.

---

### 2. Microscopic Daily Blueprint

#### 📘 Theory Deep-Dive (4 Hours)
Understand the `volatile` qualifier (tells compiler never to optimize away reads/writes because value can change outside program flow, i.e., memory-mapped hardware registers). Study `const` (defines read-only values). Learn combination behaviors: `volatile const` pointers.

#### 🛠️ Unassisted Lab Track (4 Hours)
1. Write a polling delay loop. Compile with `-O3` without `volatile`. Observe the compiler stripping away the loop in assembly.
  2. Declare the loop counter variable as `volatile` and observe the loop preserved.

---

### 3. Concrete Code Snippet & Register Mapping Example

The following code is the reference implementation illustrating the day's core technical challenge, aligned directly with the master curriculum specification:

```c
// Polling a hardware status register safely
#define UART_STATUS_REG  ((volatile uint32_t*)0x40011000)

void wait_for_data(void) {
    // Without volatile, the compiler loads the register value once
    // and loops infinitely on that cached CPU register!
    while ((*UART_STATUS_REG & 0x01) == 0) {
        // Wait...
    }
}
```

---

### 4. Post-Silicon Validation & Verification Plan

To verify this day's execution on real hardware/host system:
*   **Verification Checklist:**
    *   Monitor register configurations, compiler exit statuses, or stack frame values.
    *   Perform static scans or logic traces to confirm execution satisfies safety bounds.
