# The Super Boss Vetting Specification
## Phase 1: Foundations of Embedded C & Digital Logic
### Variable Lifetimes, Scope context, Memory Alignments & Compilers

---

## 🏛️ Section 1: Architectural Week Alignment & Reference Manifest

*   **Target Phase:** Phase 1: Foundations of Embedded C & Digital Logic
*   **Target Week:** Week 02
*   **Hardware Anchor:** Static Random Access Memory (SRAM) boundary layout, stack segments, and data bus registers
*   **Documentation Map:**
    *   ISO/IEC C11 standard library layout, GCC optimization flags, and structure alignment padding maps.
    *   Target Core Reference Technical Manuals.

---

## 📅 Section 2: Microscopic Daily Blueprint

### Monday: The First-Principles Core
*   📘 **Theory Deep-Dive (4 Hours):** Variable lifetimes, scope boundaries (static, extern, register), and volatile registers cache-coherency bypass.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write code testing 'static volatile' vs standard 'volatile' variable caching behaviors inside registers under -O2.

### Tuesday: Structural Architectures
*   📘 **Theory Deep-Dive (4 Hours):** SRAM structure segments layout: stack, heap, .data, .bss, and custom linker-defined memory blocks.
*   🛠️ **Unassisted Lab Track (4 Hours):** Modify a raw assembly link map, shifting variables from .data to .bss and inspecting size changes via 'size'.

### Wednesday: Device Interface Mechanics
*   📘 **Theory Deep-Dive (4 Hours):** Structure padding alignment: 32-bit vs 64-bit alignment constraints, memory access efficiency, and bitfields maps.
*   🛠️ **Unassisted Lab Track (4 Hours):** Construct nested structures. Measure size changes using 'sizeof' and apply '__attribute__((packed))' to verify padding drop.

### Thursday: Concurrency & System Bounds
*   📘 **Theory Deep-Dive (4 Hours):** Compiler translate workflow: preprocessing, compiling, assembly, linking, and ELF binary segment configurations.
*   🛠️ **Unassisted Lab Track (4 Hours):** Compile custom files separately, run symbol relocations using 'objdump -t', and inspect symbol bindings.

### Friday: Advanced Configurations
*   📘 **Theory Deep-Dive (4 Hours):** Compiler optimization levels (-O0, -O1, -O2, -Os, -O3) side-effects, code reordering, and volatile correct usage.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write a delay loop. Observe execution speed variations and loop elimination under -O3 and resolve using volatile.

### Saturday: Verification & Systems Proof
*   📘 **Theory Deep-Dive (4 Hours):** Linker scripts (.ld) layout: MEMORY, SECTIONS, keep attributes, and custom segment section mapping rules.
*   🛠️ **Unassisted Lab Track (4 Hours):** Write custom linker scripts, allocate an array to SRAM, and verify memory map locations via MAP file.

---

## 💻 Section 3: Concrete Code Snippet & Register Mapping Example

The following code is a production-grade, zero-abstraction C implementation. It implements the target week's core registers update using direct volatile pointer manipulation.

```c
// Struct packing and padding alignment control
#include <stdint.h>

struct __attribute__((packed)) PackedSensor {
    uint8_t  id;
    uint32_t value;
    uint16_t status;
};

void process_packed_data(void) {
    volatile struct PackedSensor sensor = { 0x01, 0xABCDEFU, 0x12 };
    (void)sensor;
}
```

---

## 🔬 Section 4: Post-Silicon Validation & Instrumentation Plan

*   **Validation Tooling:** Compile code with -Wpadded. Output size check via 'size' tool to ensure zero padding bytes are generated.
*   **Expected Waveform / Latency Envelope:**
    *   Slew rate and execution latency boundaries are measured using physical logic analyzers and high-frequency scopes.
    *   Trace analysis must verify zero clock drift and clean edge transitions.

---

## ❓ Section 5: First-Principles Critical Thinking Challenges

1.  **Challenge 1:** Why does accessing unaligned fields on ARM Cortex-M0 trigger a usage fault while M4 executes it with delay cycles?
2.  **Challenge 2:** Detail the behavior of 'volatile' in a multi-core concurrent system. Does it prevent compiler re-ordering across cores?
3.  **Challenge 3:** What happens to local static variable symbols during linking if they share identical variable names across different files?
