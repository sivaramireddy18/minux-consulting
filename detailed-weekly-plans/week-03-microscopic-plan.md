# The Super Boss Vetting Specification
## Phase 1: Foundations of Embedded C & Digital Logic
### Pointers, Pointers Arithmetic, Array Decays, and Callback Jump Tables

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 1: Foundations of Embedded C & Digital Logic
*   **Target Week:** Week 03
*   **Hardware Anchor:** Address generation registers, memory bus controllers, and system stack arrays
*   **Documentation Map:**
    *   ARMv7-M Architecture Reference Manual (Memory Map), C11 Pointer arithmetic rules, and callback syntax.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** Pointer types, direct addressing, void pointer conversions, and physical register map castings.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write code to cast volatile integer registers, write values, and verify memory updates using GDB.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** Pointer arithmetic: scaling by type sizes, address indexing, offset calculations, and double pointers dereferencing.
*   🛠️ **Unassisted Lab Track (4 Hours):** Implement a raw byte buffer parsing system using uint8_t pointers, incrementing pointers by varying type steps.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** Array decay bounds, array indexing vs pointer dereferencing, and multi-dimensional array memory maps.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write code demonstrating array decay traps inside functions. Measure structure array sizing differences.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** Callback function pointers syntax, register configurations, jump offsets, and callback tables layout.
*   🛠️ **Unassisted Lab Track (4 Hours):** Build a dynamic system event callback dispatcher, register three different handlers, and verify branching transitions.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** Function jump tables structure, branch target optimizations, compiler assembly branch generation, and ISR callbacks.
*   🛠️ **Unassisted Lab Track (4 Hours):** Construct an inline jump table map of function pointers, trigger jumps using key inputs, and trace execution paths in GDB.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** Safe pointer constraints: NULL checks, boundary overflow checks, void pointer conversions, and typecasting rules.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write pointer boundary checks, verify unaligned casts, and run Mypy/static checkers.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Dynamic callback table mapping register addresses
#include <stdint.h>

typedef void (*SystemCallback)(uint32_t event_data);

#define EVENT_LIMIT 3U
static SystemCallback callback_table[EVENT_LIMIT];

void register_event_handler(uint32_t event_id, SystemCallback callback) {
    if (event_id < EVENT_LIMIT && callback != 0) {
        callback_table[event_id] = callback;
    }
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Trace function callback execution jumps. Breakpoints on table entries. GDB verification of R0-R3 register inputs.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** Explain the difference between 'const int *ptr', 'int * const ptr', and 'const int * const ptr' compile-time limits.
2.  **Challenge 2:** What is the exact machine-code branch instruction generated when invoking a function pointer on ARM Cortex-M4?
3.  **Challenge 3:** How do pointer arithmetic operations behave when applied to void pointers (void *) on GCC compilers?
